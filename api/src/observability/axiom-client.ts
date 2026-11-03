import { Axiom } from '@axiomhq/js';

export class AxiomClient {
  private client?: Axiom;

  private getClient(): Axiom | null {
    if (process.env.NODE_ENV === 'test') {
      return null;
    }

    if (
      !process.env.AXIOM_TOKEN ||
      !process.env.AXIOM_DATASET ||
      !process.env.AXIOM_EDGE
    ) {
      return null;
    }

    if (!this.client) {
      this.client = new Axiom({
        token: process.env.AXIOM_TOKEN,
        edge: process.env.AXIOM_EDGE,
        onError: (error) => {
          console.error('Axiom background flush failed', error);
        },
      });
    }

    return this.client;
  }

  logRequest(event: Record<string, unknown>): void {
    const client = this.getClient();

    if (!client) {
      return;
    }

    try {
      client.ingest(process.env.AXIOM_DATASET!, event);
      console.log('Axiom: queued event for ingest', {
        dataset: process.env.AXIOM_DATASET,
        method: event.method,
        path: event.path,
      });
    } catch (error) {
      console.error('Failed to log request to Axiom', error);
    }
  }
}
