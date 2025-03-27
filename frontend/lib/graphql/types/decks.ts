import { CardWithCopies } from "./cards";

export interface Deck {
  id: string;
  name: string;
  gameNumber: number;
  cards: CardWithCopies[];
}
