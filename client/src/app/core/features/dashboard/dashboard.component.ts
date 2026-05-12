import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

import { VotingConfig } from '../../../shared/models/voting-config.models';
import { VotePlain, VoteEncrypted } from '../../../shared/models/vote.model';

import { VotingConfigService } from '../../services/voting-config.service';
import { VoteService } from '../../services/vote.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Candidate } from '../../../shared/models/voting-config.models';
import "flag-icons/css/flag-icons.min.css";
import { LocalRoundState } from '../../../shared/models/p2p.models';
import { P2PNetworkService } from '../../services/p2p-network.service';
import { SessionService } from '../../services/session.service';
import { Subscription } from 'rxjs';
import { API_CONFIG } from '../../config/api.config';
import { VotingState, VoteStep, SelectedPerformanceVideo } from '../../../shared/models/dashboard.model';
import { EncryptedEnvelope } from '../../../shared/models/encrypted.model';

import { P2PCryptoService } from '../../services/p2p-crypto.service';
import { HybridCryptoService } from '../../services/hybrid-crypto.service';
import { VoterKeyService } from '../../services/voter-key.service';
import { CountryKeyService } from '../../services/country-key.service';
import {
  P2PMessage,
  SignedP2PPayload,
  TokenRoundProof,
  TokenRoundProofPayload,
  PresidentInnerPayload,
  NotaryInnerPayload,
  SecretaryInnerPayload,
  VoteToSecretaryMessage,
  VoteToSecretaryPayload,
  SecretaryBatchToNotaryPayload,
  SecretaryBatchToNotaryMessage,
  NotaryBatchToPresidentPayload,
  NotaryHashCommitmentPayload,
  NotaryBatchToPresidentMessage,
  VotingResultBlock,
  VotingResultBlockPayload,
  ProposedBlockMessage,
  ProposedBlockPayload
} from '../../../shared/models/p2p-message.models';
import { VoteToken } from '../../../shared/models/token.models';
import { canonicalJson } from '../../utils/canonical-json.util';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, OnDestroy {
  voting: VotingConfig | null = null;
  votingState: VotingState | null = null;
  voteStep: VoteStep = 'selection';
  selectedPerformance: SelectedPerformanceVideo | null = null;

  selectedCountries: string[] = [];
  votePlain: VotePlain | null = null;
  votePlainHash: string = "";

  countdownText = "";
  private intervalId: number | null = null;

  loading = false;
  errorMessage = "";
  successMessage = "";

  loadingVoting = false;
  preparingVote = false;
  joiningP2P = false;

  waitingState: any | null = null;
  roundState: LocalRoundState | null = null;
  connectionEvents: any[] = [];
  p2pMessages: any[] = [];
  p2pError: string | null = null;
  disconnectedPeers: string[] = [];

  private subscriptions: Subscription[] = [];

  voteSentToSecretary = false;
  secretaryBatchSentToNotary = false;
  notaryBatchSentToPresident = false;
  presidentBlockPublished = false;

  graphNodes: Array<{
    peerId: string;
    x: number;
    y: number;
    role: 'secretary' | 'notary' | 'president' | 'voter';
    roleLabel: string;
    isSelf: boolean;
  }> = [];

  graphEdges: Array<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }> = [];

  receivedVotesAsSecretary: Array<{
    fromPeerId: string;
    encryptedForNotary: EncryptedEnvelope;
  }> = [];

  receivedSecretaryBatchAsNotary: SignedP2PPayload<SecretaryBatchToNotaryPayload> | null = null;
  receivedNotaryItems: NotaryInnerPayload[] = [];

  receivedBatchAsPresident: SignedP2PPayload<NotaryBatchToPresidentPayload> | null = null;

  blockchain: VotingResultBlock[] = [];
  finalResults: Record<string, number> | null = null;
  voterId: string = "";

  constructor(
    private authService: AuthService,
    private router: Router,
    private votingConfigService: VotingConfigService,
    private voteService: VoteService,
    private sanitizer: DomSanitizer,
    private sessionService: SessionService,
    private p2pNetworkService: P2PNetworkService,
    private p2pCryptoService: P2PCryptoService,
    private hybridCryptoService: HybridCryptoService,
    private voterKeyService: VoterKeyService,
    private countryKeyService: CountryKeyService
  ) { }

  async ngOnInit() {
    this.subscribeToP2PState();
    await this.loadVotingConfig();
  }

  ngOnDestroy(): void {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
    }

    for (const subscription of this.subscriptions) {
      subscription.unsubscribe();
    }
  }

  private async loadVotingConfig() {
    try {
      this.loading = true;
      this.errorMessage = "";
      this.successMessage = "";

      this.voting = await this.votingConfigService.getVotingConfig();
      this.updateVotingState();

      this.intervalId = window.setInterval(() => {
        this.updateVotingState();
      }, 1000);
    } catch (error) {
      this.errorMessage = "Error al cargar la votación";
    } finally {
      this.loading = false;
    }
  }

  private async updateVotingState() {
    if (!this.voting) {
      this.votingState = null;
      return;
    }

    const now = Date.now();
    const start = new Date(this.voting.votingStart).getTime();
    const end = new Date(this.voting.votingEnd).getTime();

    if (now < start) {
      this.votingState = 'not-started';
      this.countdownText = this.formatCountdown(start - now);
      return;
    } else if (now > end) {
      this.votingState = 'closed';
      this.countdownText = "La votación ha finalizado";
      return;
    } else {
      this.votingState = 'open';
      this.countdownText = "La votación está abierta";
    }
  }

  private formatCountdown(ms: number): string {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));

    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) return `${days} días ${hours} horas ${minutes} minutos ${seconds} segundos`;
    if (hours > 0) return `${hours} horas ${minutes} minutos ${seconds} segundos`;
    return `${minutes} minutos ${seconds} segundos`;
  }

  onCountrySelectionChange(countryCode: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;

    if (checked) {
      if (!this.selectedCountries.includes(countryCode)) {
        this.selectedCountries = [...this.selectedCountries, countryCode]
      }
    } else {
      this.selectedCountries = this.selectedCountries.filter(
        (code) => code !== countryCode
      )
    }
  }

  async confirmVote(): Promise<void> {
    try {
      this.errorMessage = "";
      this.successMessage = "";

      if (this.votingState !== "open") {
        throw new Error("La votación no está abierta");
      }

      this.votePlain = this.voteService.prepareVotePlain(this.selectedCountries);
      this.votePlainHash = await this.p2pCryptoService.hashCanonical(this.votePlain);

      this.voteStep = 'p2p';
      this.successMessage = "Voto preparado correctamente. Conectando a la red P2P...";

      this.joinP2PAfterVotePrepared();
    } catch (error: any) {
      this.errorMessage = error?.message ?? "No se pudo preparar el voto";
    } finally {
      this.preparingVote = false;
    }
  }

  // TODO: Eliminar
  sendTestP2PMessage(): void {
    this.p2pNetworkService.broadcastTestMessage();
  }

  prepareVote(): void {
    if (this.selectedCountries.length === 0) { return; }

    this.voteStep = 'review';
  }

  backToSelection(): void {
    this.voteStep = 'selection';
  }

  get isSecretary(): boolean {
    return !!this.roundState && this.roundState.ownPeerId === this.roundState.roles.secretary.peerId;
  }

  get isNotary(): boolean {
    return !!this.roundState && this.roundState.ownPeerId === this.roundState.roles.notary.peerId;
  }

  get isPresident(): boolean {
    return !!this.roundState && this.roundState.ownPeerId === this.roundState.roles.president.peerId;
  }

  get selectedCandidates() {
    if (!this.voting?.candidates) {
      return [];
    }

    return this.voting.candidates.filter(candidate =>
      this.selectedCountries.includes(candidate.countryCode)
    );
  }

  get finalResultsList(): Array<{ country: string; points: number }> {
    if (!this.finalResults) {
      return [];
    }

    return Object.entries(this.finalResults)
      .map(([country, points]) => ({ country, points }))
      .sort((a, b) => b.points - a.points);
  }

  trackByCountry(_index: number, candidate: { countryCode: string }): string {
    return candidate.countryCode;
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  openPerformanceVideo(candidate: Candidate): void {
    if (!candidate.performanceUrl) {
      this.errorMessage = `No hay vídeo disponible para ${candidate.countryName}`;
      return;
    }

    const embedUrl = this.toYoutubeEmbedUrl(candidate.performanceUrl);

    if (!embedUrl) {
      this.errorMessage = `El vídeo de ${candidate.countryName} no tiene una URL válida`;
      return;
    }

    this.selectedPerformance = {
      countryCode: candidate.countryCode,
      countryName: candidate.countryName,
      safeUrl: this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl)
    };
  }

  closePerformanceVideo(): void {
    this.selectedPerformance = null;
  }

  // Preparar voto con triple cifrado para enviarlo al secretario
  async sendVoteToSecretary(): Promise<void> {
    try {
      if (!this.roundState) { throw new Error("No hay ronda P2P activa"); }
      if (!this.votePlain) { throw new Error("No hay ningún voto preparado"); }
      if (!this.votePlainHash) { throw new Error("No hay ningún hash de voto preparado"); }
      if (this.voteSentToSecretary) { return };

      const secretary = this.roundState.roles.secretary;
      const notary = this.roundState.roles.notary;
      const president = this.roundState.roles.president;

      const voteToken = this.getStoredVoteToken();
      const tokenRoundProofPayload: TokenRoundProofPayload = {
        roundId: this.roundState.roundId,
        roundNumber: this.roundState.roundNumber,
        token: voteToken
      };
      const signedTokenRoundProof = await this.p2pCryptoService.signWithTokenSigningKey(tokenRoundProofPayload);
      const tokenRoundProof: TokenRoundProof = {
        payload: tokenRoundProofPayload,
        signatureBase64: signedTokenRoundProof.signatureBase64
      };

      const presidentInnerPayload: PresidentInnerPayload = {
        roundId: this.roundState.roundId,
        roundNumber: this.roundState.roundNumber,
        votePlain: this.votePlain,
        tokenRoundProof
      };
      const encryptedForPresident = await this.hybridCryptoService.encryptJsonForPublicKey(
        presidentInnerPayload,
        president.encryptionPublicKey
      );

      const notaryInnerPayload: NotaryInnerPayload = {
        roundId: this.roundState.roundId,
        roundNumber: this.roundState.roundNumber,
        votePlainHash: this.votePlainHash,
        encryptedForPresident
      }
      const encryptedForNotary = await this.hybridCryptoService.encryptJsonForPublicKey(
        notaryInnerPayload,
        notary.encryptionPublicKey
      );

      const secretaryInnerPayload: SecretaryInnerPayload = {
        roundId: this.roundState.roundId,
        roundNumber: this.roundState.roundNumber,
        encryptedForNotary
      };
      const encryptedForSecretary = await this.hybridCryptoService.encryptJsonForPublicKey(
        secretaryInnerPayload,
        secretary.encryptionPublicKey
      );

      const voteToSecretaryPayload: VoteToSecretaryPayload = {
        roundId: this.roundState.roundId,
        roundNumber: this.roundState.roundNumber,
        fromPeerId: this.roundState.ownPeerId,
        toSecretaryPeerId: secretary.peerId,
        encryptedForSecretary
      }
      const signedVoteToSecretaryPayload = await this.p2pCryptoService.signWithVoterSigningKey(
        this.roundState.ownPeerId,
        voteToSecretaryPayload
      );

      const message: VoteToSecretaryMessage = {
        type: "VOTE_TO_SECRETARY",
        payload: signedVoteToSecretaryPayload
      }


      if (this.isSecretary) {
        await this.handleVoteToSecretary(signedVoteToSecretaryPayload);
      } else {
        this.p2pNetworkService.sendToPeer(secretary.peerId, message);
        this.successMessage = "Voto enviado al secretario";
      }

      this.voteSentToSecretary = true;

    } catch (error: any) {
      this.errorMessage = error?.message ?? "No se puedo enviar el voto al secretario";
    }
  }

  // El secreario prepara los votos para enviarselos al notario
  private async sendSecretaryBatchToNotary(): Promise<void> {
    try {
      if (!this.roundState) {
        throw new Error("No hay ronda P2P activa");
      }

      if (!this.isSecretary || this.secretaryBatchSentToNotary) { return; }

      const expectedVotes = this.roundState.peers.length;

      if (this.receivedVotesAsSecretary.length < expectedVotes) {
        this.successMessage =
          `Secretario: esperando votos ${this.receivedVotesAsSecretary.length}/${expectedVotes}`;
        return;
      }

      const notary = this.roundState.roles.notary;

      const encryptedForNotaryBatch = this.shuffleArray(
        this.receivedVotesAsSecretary.map((item) => item.encryptedForNotary)
      );

      const payload: SecretaryBatchToNotaryPayload = {
        roundId: this.roundState.roundId,
        roundNumber: this.roundState.roundNumber,
        secretaryPeerId: this.roundState.roles.secretary.peerId,
        notaryPeerId: notary.peerId,
        encryptedForNotaryBatch
      };

      const signedPayload = await this.p2pCryptoService.signWithVoterSigningKey(this.roundState.ownPeerId, payload);

      const message: SecretaryBatchToNotaryMessage = {
        type: "SECRETARY_BATCH_TO_NOTARY",
        payload: signedPayload
      };

      this.p2pNetworkService.sendToPeer(notary.peerId, message);

      this.secretaryBatchSentToNotary = true;

      this.successMessage += this.isNotary
        ? "\n Lote del secretario procesado localmente como notario"
        : "\n Lote mezclado enviado al notario";
    } catch (error: any) {
      this.errorMessage =
        error?.message ?? "No se pudo enviar el lote del secretario al notario";
    }
  }

  // El notario prepara los votos para enviarselos al presidente
  private async sendNotaryBatchToPresident(): Promise<void> {
    try {
      if (!this.roundState) { throw new Error("No hay ronda P2P activa"); }

      if (!this.isNotary || this.notaryBatchSentToPresident) { return; }

      if (this.receivedNotaryItems.length === 0) {
        throw new Error("El notario no tiene votos para enviar al presidente");
      }

      const president = this.roundState.roles.president;

      const shuffledItems = this.shuffleArray(this.receivedNotaryItems);

      const votePlainHashes = this.shuffleArray(
        shuffledItems.map((item) => item.votePlainHash)
      );

      const encryptedForPresidentBatch = this.shuffleArray(
        shuffledItems.map((item) => item.encryptedForPresident)
      );

      const commitmentPayload: NotaryHashCommitmentPayload = {
        roundId: this.roundState.roundId,
        roundNumber: this.roundState.roundNumber,
        notaryPeerId: this.roundState.roles.notary.peerId,
        votePlainHashes
      };

      const notaryHashCommitment = await this.p2pCryptoService.signWithVoterSigningKey(
        this.roundState.ownPeerId,
        commitmentPayload
      );

      const payload: NotaryBatchToPresidentPayload = {
        roundId: this.roundState.roundId,
        roundNumber: this.roundState.roundNumber,
        notaryPeerId: this.roundState.roles.notary.peerId,
        presidentPeerId: president.peerId,
        notaryHashCommitment,
        encryptedForPresidentBatch
      };

      const signedPayload = await this.p2pCryptoService.signWithVoterSigningKey(
        this.roundState.ownPeerId,
        payload
      );

      const message: NotaryBatchToPresidentMessage = {
        type: "NOTARY_BATCH_TO_PRESIDENT",
        payload: signedPayload
      };

      this.p2pNetworkService.sendToPeer(president.peerId, message);

      this.successMessage = this.isPresident
        ? "Lote del notario procesado localmente como presidente"
        : "Notario: compromiso de hashes y lote enviados al presidente";

      this.notaryBatchSentToPresident = true;
    } catch (error: any) {
      this.errorMessage =
        error?.message ?? "No se pudo enviar el lote del notario al presidente";
    }
  }

  // Función para cuando el secretario recibe un voto, incluyendo el propio
  private async handleVoteToSecretary(signedPayload: SignedP2PPayload<VoteToSecretaryPayload>): Promise<void> {
    if (!this.roundState || !this.isSecretary) { return; }

    const payload = signedPayload.payload;

    this.assertCurrentRound(payload.roundId, payload.roundNumber);

    if (payload.toSecretaryPeerId !== this.roundState.roles.secretary.peerId) {
      throw new Error("El mensaje no va dirigido al secretario de esta ronda");
    }

    if (signedPayload.signerPeerId !== payload.fromPeerId) {
      throw new Error("El firmante no coincide con el remitente del voto");
    }

    const senderPeer = this.getPeerById(payload.fromPeerId);
    const isSignatureValid = await this.p2pCryptoService.verifySignedP2PPayload(
      signedPayload,
      senderPeer.voterSigningPublicKey
    );
    if (!isSignatureValid) {
      throw new Error("Firma del votante inválida en el mensaje al secretario");
    }

    const ownEncryptionKeyPair = await this.voterKeyService.ensureEncryptionVoteKeyPair();
    const secretaryInnerPayload = await this.decryptEnvelope<SecretaryInnerPayload>(
      payload.encryptedForSecretary,
      ownEncryptionKeyPair.privateKey
    );

    this.assertCurrentRound(secretaryInnerPayload.roundId, secretaryInnerPayload.roundNumber);

    const alreadyReceived = this.receivedVotesAsSecretary.some(
      (item) => item.fromPeerId === payload.fromPeerId
    );
    if (alreadyReceived) { return; }

    this.receivedVotesAsSecretary = [
      ...this.receivedVotesAsSecretary,
      {
        fromPeerId: payload.fromPeerId,
        encryptedForNotary: secretaryInnerPayload.encryptedForNotary
      }
    ];

    this.successMessage = `Secretario: votos recibidos ${this.receivedVotesAsSecretary.length}/${this.roundState.peers.length}`;

    if (this.receivedVotesAsSecretary.length >= this.roundState.peers.length) {
      await this.sendSecretaryBatchToNotary();
    }
  }

  // Funcion para cuando el notario recibe el paquete de votos
  private async handleSecretaryBatchToNotary(
    signedPayload: SignedP2PPayload<SecretaryBatchToNotaryPayload>
  ): Promise<void> {
    if (!this.roundState || !this.isNotary) { return; }

    const payload = signedPayload.payload;
    this.receivedSecretaryBatchAsNotary = signedPayload;

    this.assertCurrentRound(payload.roundId, payload.roundNumber);

    if (payload.notaryPeerId !== this.roundState.roles.notary.peerId) {
      throw new Error("El lote no va dirigido al notario de esta ronda");
    }

    if (payload.secretaryPeerId !== this.roundState.roles.secretary.peerId) {
      throw new Error("El lote no procede del secretario de esta ronda");
    }

    if (signedPayload.signerPeerId !== this.roundState.roles.secretary.peerId) {
      throw new Error("El firmante no es el secretario de la ronda");
    }

    const signatureValid = await this.p2pCryptoService.verifySignedP2PPayload(
      signedPayload,
      this.roundState.roles.secretary.voterSigningPublicKey
    );

    if (!signatureValid) {
      throw new Error("Firma inválida del secretario");
    }

    const ownEncryptionKeyPair = await this.voterKeyService.ensureEncryptionVoteKeyPair();
    const decryptedItems: NotaryInnerPayload[] = [];

    for (const encryptedForNotary of payload.encryptedForNotaryBatch) {
      const item = await this.decryptEnvelope<NotaryInnerPayload>(
        encryptedForNotary,
        ownEncryptionKeyPair.privateKey
      );

      this.assertCurrentRound(item.roundId, item.roundNumber);

      if (!item.votePlainHash || !item.encryptedForPresident) {
        throw new Error("Elemento del lote del notario malformado");
      }

      decryptedItems.push(item);
    }

    this.receivedNotaryItems = decryptedItems;

    this.successMessage += `\n Notario: lote recibido del secretario con ${payload.encryptedForNotaryBatch.length} votos cifrados`;
    this.successMessage += `\n Notario: ${decryptedItems.length} hashes de voto descifrados`;

    await this.sendNotaryBatchToPresident();
  }

  // Funcion para cuando el presidente recibe el paquete de votos
  private async handleNotaryBatchToPresident(
    signedPayload: SignedP2PPayload<NotaryBatchToPresidentPayload>
  ): Promise<void> {
    if (!this.roundState || !this.isPresident) {
      return;
    }

    const payload = signedPayload.payload;

    this.assertCurrentRound(payload.roundId, payload.roundNumber);

    if (payload.presidentPeerId !== this.roundState.roles.president.peerId) {
      throw new Error("El lote no va dirigido al presidente de esta ronda");
    }

    if (payload.notaryPeerId !== this.roundState.roles.notary.peerId) {
      throw new Error("El lote no procede del notario de esta ronda");
    }

    if (signedPayload.signerPeerId !== this.roundState.roles.notary.peerId) {
      throw new Error("El firmante no es el notario de la ronda");
    }

    const signatureValid = await this.p2pCryptoService.verifySignedP2PPayload(
      signedPayload,
      this.roundState.roles.notary.voterSigningPublicKey
    );

    if (!signatureValid) {
      throw new Error("Firma inválida del lote del notario");
    }

    const commitment = payload.notaryHashCommitment;

    if (commitment.signerPeerId !== this.roundState.roles.notary.peerId) {
      throw new Error("El compromiso de hashes no está firmado por el notario");
    }

    const commitmentValid = await this.p2pCryptoService.verifySignedP2PPayload(
      commitment,
      this.roundState.roles.notary.voterSigningPublicKey
    );

    if (!commitmentValid) {
      throw new Error("Firma inválida del compromiso de hashes del notario");
    }

    this.assertCurrentRound(commitment.payload.roundId, commitment.payload.roundNumber);

    if (commitment.payload.notaryPeerId !== this.roundState.roles.notary.peerId) {
      throw new Error("El compromiso de hashes pertenece a otro notario");
    }

    if (commitment.payload.votePlainHashes.length !== payload.encryptedForPresidentBatch.length) {
      throw new Error("El número de hashes no coincide con el número de paquetes para presidente");
    }

    this.receivedBatchAsPresident = signedPayload;

    this.successMessage +=
      `\n Presidente: lote recibido del notario con ${payload.encryptedForPresidentBatch.length} votos cifrados`;

    await this.processPresidentBatchAndPublishBlock();
  }

  // Todos reciben propuesta de bloque
  private async handleProposedBlock(block: VotingResultBlock): Promise<void> {
    const alreadyExists = this.blockchain.some(
      (existingBlock) => existingBlock.hash === block.hash
    );

    if (alreadyExists) {
      return;
    }

    const blockValid = await this.verifyReceivedBlock(block);

    if (!blockValid) {
      throw new Error("El bloque recibido no es válido");
    }

    this.blockchain = [...this.blockchain, block];

    if (block.payload.status === "VALID" && block.payload.tally) {
      this.finalResults = block.payload.tally;
      this.successMessage = "Resultados finales recibidos y verificados";
    }

    if (block.payload.status === "ABORTED") {
      this.errorMessage = `Ronda anulada: ${block.payload.reason}`;
    }
  }

  // Presidente procesa los votos recibidos y crea una propuesta de bloque
  private async processPresidentBatchAndPublishBlock(): Promise<void> {
    try {
      if (!this.roundState) { throw new Error("No hay ronda P2P activa"); }

      if (!this.isPresident || this.presidentBlockPublished) { return; }

      if (!this.receivedBatchAsPresident) {
        throw new Error("El presidente no ha recibido lote del notario");
      }

      const payload = this.receivedBatchAsPresident.payload;
      const ownEncryptionKeyPair = await this.voterKeyService.ensureEncryptionVoteKeyPair();
      const decryptedPackages: PresidentInnerPayload[] = [];

      for (const encryptedForPresident of payload.encryptedForPresidentBatch) {
        const presidentInnerPayload =
          await this.decryptEnvelope<PresidentInnerPayload>(
            encryptedForPresident,
            ownEncryptionKeyPair.privateKey
          );

        this.assertCurrentRound(
          presidentInnerPayload.roundId,
          presidentInnerPayload.roundNumber
        );

        decryptedPackages.push(presidentInnerPayload);
      }

      const votes = decryptedPackages.map((item) => item.votePlain);
      const tokenRoundProofs = decryptedPackages.map((item) => item.tokenRoundProof);

      const hashesOk = await this.verifyVotesAgainstNotaryHashes(
        votes,
        payload.notaryHashCommitment.payload.votePlainHashes
      );

      if (!hashesOk) {
        const abortedBlock = await this.createAbortedBlock(
          "HASH_COMMITMENT_MISMATCH",
          []
        );

        await this.publishBlock(abortedBlock);
        return;
      }

      const tokenValidation = await this.validateTokenRoundProofs(tokenRoundProofs);

      if (!tokenValidation.ok) {
        console.error("Tokens inválidos detectados:", tokenValidation.invalidTokens);
        const firstReason = tokenValidation.invalidTokens[0]?.reason ?? "INVALID_TOKEN";

        const abortedBlock = await this.createAbortedBlock(
          firstReason,
          tokenValidation.invalidTokens
        );

        await this.publishBlock(abortedBlock);
        return;
      }

      const tally = this.calculateTally(votes);

      const validBlock = await this.createValidBlock({
        votes: this.shuffleArray(votes),
        tokenRoundProofs: this.shuffleArray(tokenRoundProofs),
        tally
      });

      await this.publishBlock(validBlock);
    } catch (error: any) {
      this.errorMessage =
        error?.message ?? "No se pudo procesar el lote del presidente";
    }
  }

  private async publishBlock(block: VotingResultBlock): Promise<void> {
    await this.handleProposedBlock(block);

    const message: P2PMessage<ProposedBlockPayload> = {
      type: "PROPOSED_BLOCK",
      payload: {
        block
      }
    };

    this.p2pNetworkService.broadcast(message);

    this.successMessage +=
      block.payload.status === "VALID"
        ? "\n Presidente: bloque válido publicado con resultados finales"
        : "\n Presidente: ronda anulada por inconsistencias";

    this.presidentBlockPublished = true;
  }

  private toYoutubeEmbedUrl(url: string): string | null {
    const videoId = this.extractYoutubeVideoId(url);

    if (!videoId) {
      return null;
    }

    return `https://www.youtube.com/embed/${videoId}`;
  }

  private extractYoutubeVideoId(url: string): string | null {
    const match = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
    );

    return match ? match[1] : null;
  }

  private joinP2PAfterVotePrepared(): void {
    const sessionToken = this.sessionService.getSessionToken();

    console.log(sessionToken);

    if (!sessionToken) {
      throw new Error("No hay sesión activa");
    }

    const voterRaw = localStorage.getItem("tfg_voter");

    if (!voterRaw) {
      throw new Error("No hay votante autenticado");
    }

    const voter = JSON.parse(voterRaw);

    if (!voter.voterId) {
      throw new Error("No se pudo obtener el voterId");
    }

    this.joiningP2P = true;
    this.voterId = voter.voterId;

    const wsUrl = this.getSignalingUrl();

    this.p2pNetworkService.connectAndJoin({
      wsUrl,
      sessionToken,
      voterId: voter.voterId
    });
  }

  private subscribeToP2PState(): void {
    this.p2pNetworkService.waitingState$.subscribe((state) => {
      this.waitingState = state;
    });

    this.p2pNetworkService.disconnectedPeers$.subscribe((peers) => {
      this.disconnectedPeers = peers;
    });

    this.p2pNetworkService.roundState$.subscribe(async (state) => {
      this.roundState = state;

      if (state) {
        this.joiningP2P = false;
        this.voteStep = 'p2p';
        this.successMessage = 'Ronda P2P creada correctamente';
        this.buildP2PGraph();

        await this.sendVoteToSecretary();
      }
    });

    this.p2pNetworkService.connectionEvents$.subscribe((events) => {
      this.connectionEvents = events;

      const disconnectedStates = new Set([
        'disconnected',
        'failed',
        'closed',
        'peer-disconnected',
        'datachannel-closed'
      ]);

      const disconnected = events
        .filter((event) => disconnectedStates.has(event.state))
        .map((event) => event.peerId)
        .filter((peerId) => !!peerId);

      this.disconnectedPeers = Array.from(new Set(disconnected));

      if (this.roundState) {
        this.buildP2PGraph();
      }
    });

    this.p2pNetworkService.p2pMessages$.subscribe(async (messages) => {
      this.p2pMessages = messages;

      const lastMessage = messages[messages.length - 1];

      if (lastMessage?.data) {
        await this.handleIncomingVotingP2PMessage(lastMessage.data);
      }
    });

    this.p2pNetworkService.error$.subscribe((error) => {
      this.p2pError = error;

      if (error) {
        this.joiningP2P = false;
      }
    });
  }

  private getSignalingUrl(): string {
    return API_CONFIG.WS_URL;
  }

  private getStoredVoteToken(): any {
    const raw = localStorage.getItem("tfg_vote_token");

    if (!raw) {
      throw new Error("No se ha encontrado el token de voto");
    }

    return JSON.parse(raw);
  }

  private getPeerById(peerId: string) {
    const peer = this.roundState?.peers.find((item) => item.peerId === peerId);

    if (!peer) {
      throw new Error(`Peer no encontrado en la ronda: ${peerId}`);
    }

    return peer;
  }

  private assertCurrentRound(roundId: string, roundNumber: number): void {
    if (!this.roundState) {
      throw new Error("No hay ronda activa");
    }

    if (
      this.roundState.roundId !== roundId ||
      this.roundState.roundNumber !== roundNumber
    ) {
      throw new Error("Mensaje recibido para otra ronda");
    }
  }

  private async decryptEnvelope<T>(
    encrypted: EncryptedEnvelope,
    privateKeyPem: string
  ): Promise<T> {
    const decrypted = await this.hybridCryptoService.decryptJsonWithPrivateKey(
      encrypted,
      privateKeyPem
    );

    if (typeof decrypted === "string") {
      return JSON.parse(decrypted) as T;
    }

    return decrypted as T;
  }

  private async handleIncomingVotingP2PMessage(message: P2PMessage): Promise<void> {
    try {
      if (!message?.type) {
        return;
      }

      switch (message.type) {
        case "VOTE_TO_SECRETARY":
          await this.handleVoteToSecretary(
            message.payload as SignedP2PPayload<VoteToSecretaryPayload>
          );
          break;
        case "SECRETARY_BATCH_TO_NOTARY":
          await this.handleSecretaryBatchToNotary(
            message.payload as SignedP2PPayload<SecretaryBatchToNotaryPayload>
          );
          break;
        case "NOTARY_BATCH_TO_PRESIDENT":
          await this.handleNotaryBatchToPresident(
            message.payload as SignedP2PPayload<NotaryBatchToPresidentPayload>
          );
          break;
        case "PROPOSED_BLOCK":
          await this.handleProposedBlock(
            (message.payload as ProposedBlockPayload).block
          );
          break;
      }
    } catch (error: any) {
      this.errorMessage =
        error?.message ?? "Error procesando mensaje P2P";
    }
  }

  private shuffleArray<T>(items: T[]): T[] {
    const result = [...items];

    for (let i = result.length - 1; i > 0; i--) {
      const randomArray = new Uint32Array(1);
      crypto.getRandomValues(randomArray);

      const j = randomArray[0] % (i + 1);

      [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
  }

  private async verifyVotesAgainstNotaryHashes(votes: VotePlain[], votePlainHashes: string[]): Promise<boolean> {
    if (votes.length !== votePlainHashes.length) {
      return false;
    }

    const remainingHashes = [...votePlainHashes];

    for (const vote of votes) {
      const hash = await this.p2pCryptoService.hashCanonical(vote);

      const index = remainingHashes.indexOf(hash);

      if (index < 0) { return false; }

      remainingHashes.splice(index, 1);
    }

    return remainingHashes.length === 0;
  }

  private async validateTokenRoundProofs(tokenRoundProofs: TokenRoundProof[]): Promise<{ ok: boolean; invalidTokens: any[]; }> {
    const invalidTokens: any[] = [];
    const seenTokenIds = new Set<string>();

    for (const tokenRoundProof of tokenRoundProofs) {
      const payload = tokenRoundProof.payload;
      const token = payload.token;

      if (!payload || !token) {
        invalidTokens.push({
          tokenRoundProof,
          reason: "INVALID_TOKEN",
          details: "Falta payload o token"
        });
      }

      if (
        payload.roundId !== this.roundState?.roundId ||
        payload.roundNumber !== this.roundState?.roundNumber
      ) {
        invalidTokens.push({
          tokenRoundProof,
          reason: "INVALID_TOKEN_ROUND_SIGNATURE",
          details: "La prueba de token pertenece a otra ronda"
        });
      }

      if (!token.tokenId) {
        invalidTokens.push({
          tokenRoundProof,
          reason: "INVALID_TOKEN",
          details: "El token no contiene tokenId"
        });
      }

      // TODO: debe tener en cuenta los tokens de toda la blockchain
      if (seenTokenIds.has(token.tokenId)) {
        invalidTokens.push({
          tokenRoundProof,
          reason: "DUPLICATED_TOKEN",
          details: "Token duplicado dentro de la ronda"
        });
      }

      seenTokenIds.add(token.tokenId);

      const anccSignatureValid = await this.verifyANCCSignature(token);

      if (!anccSignatureValid) {
        invalidTokens.push({
          tokenRoundProof,
          reason: "INVALID_TOKEN",
          details: "Firma ANCC inválida"
        });
      }

      if (!token.tokenSigningPublicKey) {
        invalidTokens.push({
          tokenRoundProof,
          reason: "INVALID_TOKEN",
          details: "El token no contiene clave pública de firma del votante"
        });
      }

      const tokenRoundSignatureValid = await this.p2pCryptoService.verifyWithPublicKey(
        payload,
        tokenRoundProof.signatureBase64,
        token.tokenSigningPublicKey
      );

      if (!tokenRoundSignatureValid) {
        invalidTokens.push({
          tokenRoundProof,
          reason: "INVALID_TOKEN_ROUND_SIGNATURE",
          details: "Firma token + roundId + roundNumber inválida"
        });
      }
    }

    return {
      ok: invalidTokens.length === 0,
      invalidTokens
    };
  }

  private async verifyANCCSignature(token: any): Promise<boolean> {
    if (!token.anccSignature) {
      return false;
    }

    const countryCode = this.voterId?.split("-")[0];
    const countrySigningPublicKey = this.countryKeyService.getCountrySigningPublicKey(countryCode);
    const signedPayload = this.getTokenSignedPayload(token);

    return this.p2pCryptoService.verifyWithPublicKey(signedPayload, token.anccSignature, countrySigningPublicKey);
  }

  private async verifyReceivedBlock(block: VotingResultBlock): Promise<boolean> {
    if (!this.roundState) {
      return false;
    }

    const calculatedHash = await this.p2pCryptoService.hashCanonical(
      block.payload
    );

    if (calculatedHash !== block.hash) {
      return false;
    }

    if (block.presidentPeerId !== block.payload.roles.presidentPeerId) {
      return false;
    }

    const presidentSignatureValid = await this.p2pCryptoService.verifyWithPublicKey(
      {
        payload: block.payload,
        hash: block.hash
      },
      block.presidentSignatureBase64,
      block.payload.roles.presidentVotePublicKey
    );

    if (!presidentSignatureValid) {
      return false;
    }

    if (block.payload.notaryHashCommitment) {
      const commitment = block.payload.notaryHashCommitment;

      const notarySignatureValid =
        await this.p2pCryptoService.verifySignedP2PPayload(
          commitment,
          block.payload.roles.notaryVotePublicKey
        );

      if (!notarySignatureValid) {
        return false;
      }
    }

    if (block.payload.status === "VALID") {
      const votes = block.payload.votes;
      const tokenRoundProofs = block.payload.tokenRoundProofs;
      const tally = block.payload.tally;
      const hashes = block.payload.notaryHashCommitment?.payload.votePlainHashes;

      if (!votes || !tokenRoundProofs || !tally || !hashes) {
        return false;
      }

      if (votes.length !== tokenRoundProofs.length) {
        return false;
      }

      const hashesOk = await this.verifyVotesAgainstNotaryHashes(votes, hashes);

      if (!hashesOk) {
        return false;
      }

      const tokenValidation = await this.validateTokenRoundProofs(tokenRoundProofs);

      if (!tokenValidation.ok) {
        return false;
      }

      const recalculatedTally = this.calculateTally(votes);

      if (canonicalJson(recalculatedTally) !== canonicalJson(tally)) {
        return false;
      }
    }

    if (block.payload.status === "ABORTED") {
      if (block.payload.votes && block.payload.votes.length > 0) {
        return false;
      }
    }

    return true;
  }

  private calculateTally(votes: VotePlain[]): Record<string, number> {
    const tally: Record<string, number> = {};

    for (const vote of votes) {
      const countries = vote.approved_countries ?? [];

      for (const countryCode of countries) {
        tally[countryCode] = (tally[countryCode] ?? 0) + 1;
      }
    }

    return tally;
  }

  private getTokenSignedPayload(token: any): any {
    const {
      anccSignature,
      ...payload
    } = token;

    return payload;
  }

  private async createValidBlock(params: {
    votes: VotePlain[];
    tokenRoundProofs: TokenRoundProof[];
    tally: Record<string, number>;
  }): Promise<VotingResultBlock> {
    if (!this.roundState || !this.receivedBatchAsPresident) {
      throw new Error("No hay datos suficientes para crear bloque válido");
    }

    const payload: VotingResultBlockPayload = {
      index: this.blockchain.length,
      previousHash: this.getPreviousBlockHash(),
      roundId: this.roundState.roundId,
      roundNumber: this.roundState.roundNumber,
      status: "VALID",
      roles: this.getRolesSnapshot(),
      notaryHashCommitment: this.receivedBatchAsPresident.payload.notaryHashCommitment,
      votes: params.votes,
      tokenRoundProofs: params.tokenRoundProofs,
      tally: params.tally,
      createdAt: new Date().toISOString()
    };

    return this.signBlockPayload(payload);
  }

  private async createAbortedBlock(
    reason: any,
    invalidTokens: any[]
  ): Promise<VotingResultBlock> {
    if (!this.roundState || !this.receivedBatchAsPresident) {
      throw new Error("No hay estado suficiente para crear bloque abortado");
    }

    const payload: VotingResultBlockPayload = {
      index: this.blockchain.length,
      previousHash: this.getPreviousBlockHash(),

      roundId: this.roundState.roundId,
      roundNumber: this.roundState.roundNumber,

      status: "ABORTED",
      reason,

      roles: this.getRolesSnapshot(),

      notaryHashCommitment:
        this.receivedBatchAsPresident.payload.notaryHashCommitment,

      invalidTokens,

      createdAt: new Date().toISOString()
    };

    return this.signBlockPayload(payload);
  }

  private async signBlockPayload(
    payload: VotingResultBlockPayload
  ): Promise<VotingResultBlock> {
    if (!this.roundState) {
      throw new Error("No hay ronda activa");
    }

    const hash = await this.p2pCryptoService.hashCanonical(payload);

    const signedBlock = await this.p2pCryptoService.signWithVoterSigningKey(
      this.roundState.ownPeerId,
      {
        payload,
        hash
      }
    );

    return {
      payload,
      hash,
      presidentPeerId: this.roundState.ownPeerId,
      presidentSignatureBase64: signedBlock.signatureBase64
    };
  }

  private getPreviousBlockHash(): string {
    if (this.blockchain.length === 0) {
      return "GENESIS";
    }

    return this.blockchain[this.blockchain.length - 1].hash;
  }

  private getRolesSnapshot() {
    if (!this.roundState) {
      throw new Error("No hay ronda activa");
    }

    return {
      secretaryPeerId: this.roundState.roles.secretary.peerId,
      secretaryVotePublicKey: this.roundState.roles.secretary.voterSigningPublicKey,

      notaryPeerId: this.roundState.roles.notary.peerId,
      notaryVotePublicKey: this.roundState.roles.notary.voterSigningPublicKey,

      presidentPeerId: this.roundState.roles.president.peerId,
      presidentVotePublicKey: this.roundState.roles.president.voterSigningPublicKey
    };
  }

  private buildP2PGraph(): void {
    if (!this.roundState) {
      this.graphNodes = [];
      this.graphEdges = [];
      return;
    }

    const peers = this.roundState.peers.filter(
      (peer) => !this.disconnectedPeers.includes(peer.peerId)
    );

    if (peers.length === 0) {
      this.graphNodes = [];
      this.graphEdges = [];
      return;
    }

    const ownPeerId = this.roundState.ownPeerId;
    const secretaryPeerId = this.roundState.roles.secretary.peerId;
    const notaryPeerId = this.roundState.roles.notary.peerId;
    const presidentPeerId = this.roundState.roles.president.peerId
    const total = peers.length;

    const centerX = 300;
    const centerY = 210;
    const radius = 145;

    this.graphNodes = peers.map((peer: any, index: number) => {
      const angle = (2 * Math.PI * index) / total - Math.PI / 2;

      const isSelf = peer.peerId === ownPeerId;
      const isSecretary = peer.peerId === secretaryPeerId;
      const isNotary = peer.peerId === notaryPeerId;
      const isPresident = peer.peerId === presidentPeerId;

      let role: 'secretary' | 'notary' | 'president' | 'voter' = 'voter';
      let roleLabel = 'Votante';


      if (isSecretary) {
        role = 'secretary';
        roleLabel = 'Secretario';
      }

      if (isNotary) {
        role = 'notary';
        roleLabel = 'Notario';
      }

      if (isPresident) {
        role = 'president';
        roleLabel = 'Presidente';
      }

      if (isSelf) {
        roleLabel = `Yo\n${roleLabel}`;
      }

      return {
        peerId: peer.peerId,
        countryCode: peer.countryCode,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        role,
        roleLabel,
        isSelf
      };
    });

    const edges: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];

    for (let i = 0; i < this.graphNodes.length; i++) {
      for (let j = i + 1; j < this.graphNodes.length; j++) {
        edges.push({
          x1: this.graphNodes[i].x,
          y1: this.graphNodes[i].y,
          x2: this.graphNodes[j].x,
          y2: this.graphNodes[j].y
        });
      }
    }

    this.graphEdges = edges;
  }
}
