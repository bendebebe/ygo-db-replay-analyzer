import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CardImage } from './CardImage';
import { ReplayDeck } from "@/lib/graphql/types/replays";

interface DeckDisplayProps {
  playerData: ReplayDeck[];
  activeGame: number;
  onGameChange: (game: number) => void;
}

interface SortedMainDeck {
  monsters: ReplayDeck['cards'][0][];
  spells: ReplayDeck['cards'][0][];
  traps: ReplayDeck['cards'][0][];
}

export function DeckDisplay({ playerData, activeGame, onGameChange }: DeckDisplayProps) {
  // Get available game numbers from the decks that have cards
  const availableGames = React.useMemo(() => 
    playerData
      .filter(deck => deck.cards.length > 0) // Only include games with cards
      .map(deck => deck.gameNumber)
      .sort(),
  [playerData]);

  // If the active game isn't available, default to the first available game
  React.useEffect(() => {
    if (!availableGames.includes(activeGame) && availableGames.length > 0) {
      onGameChange(availableGames[0]);
    }
  }, [activeGame, availableGames, onGameChange]);

  // Find the deck for the active game
  const currentDeck = React.useMemo(() => 
    playerData.find(deck => deck.gameNumber === activeGame) || playerData[0],
  [playerData, activeGame]);

  // Group and sort cards by type
  const { mainDeck, extraDeck } = React.useMemo(() => {
    const sorted: SortedMainDeck = {
      monsters: [],
      spells: [],
      traps: []
    };

    const extra: ReplayDeck['cards'][0][] = [];

    currentDeck.cards.forEach(card => {
      const cappedCard = card.copies > 3 ? { ...card, copies: 3 } : card;
      if (card.ygoInfo.isExtraDeck) {
        extra.push(cappedCard);
      } else {
        const type = card.ygoInfo.type.toLowerCase();
        if (type.includes('spell')) {
          sorted.spells.push(cappedCard);
        } else if (type.includes('trap')) {
          sorted.traps.push(cappedCard);
        } else {
          sorted.monsters.push(cappedCard);
        }
      }
    });

    // Sort each category by name
    sorted.monsters.sort((a, b) => a.ygoInfo.name.localeCompare(b.ygoInfo.name));
    sorted.spells.sort((a, b) => a.ygoInfo.name.localeCompare(b.ygoInfo.name));
    sorted.traps.sort((a, b) => a.ygoInfo.name.localeCompare(b.ygoInfo.name));
    extra.sort((a, b) => a.ygoInfo.name.localeCompare(b.ygoInfo.name));

    const main = [...sorted.monsters, ...sorted.spells, ...sorted.traps];

    return { mainDeck: main, extraDeck: extra };
  }, [currentDeck.cards]);

  const DeckTabs = () => (
    <Tabs defaultValue="main" className="w-full">
      <TabsList>
        <TabsTrigger value="main">Main Deck ({mainDeck.reduce((sum, card) => sum + card.copies, 0)})</TabsTrigger>
        <TabsTrigger value="extra">Extra Deck ({extraDeck.reduce((sum, card) => sum + card.copies, 0)})</TabsTrigger>
      </TabsList>
      <div className="min-h-[600px]">
        <TabsContent value="main" className="space-y-4 h-full">
          {/* Monsters Section */}
          <div className="h-full">
            <h3 className="text-sm text-white/60 mb-2">
              Monsters ({mainDeck
                .filter(card => !card.ygoInfo.type.toLowerCase().includes('spell') && !card.ygoInfo.type.toLowerCase().includes('trap'))
                .reduce((sum, card) => sum + card.copies, 0)})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {mainDeck.map((card) => (
                !card.ygoInfo.type.toLowerCase().includes('spell') && 
                !card.ygoInfo.type.toLowerCase().includes('trap') && (
                  <CardImage
                    key={card.serialNumber}
                    serialNumber={card.serialNumber}
                    name={card.ygoInfo.name}
                    imageUrl={card.imageUrl}
                    count={card.copies}
                  />
                )
              ))}
            </div>
          </div>
          
          {/* Spells Section */}
          <div>
            <h3 className="text-sm text-white/60 mb-2">
              Spells ({mainDeck
                .filter(card => card.ygoInfo.type.toLowerCase().includes('spell'))
                .reduce((sum, card) => sum + card.copies, 0)})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {mainDeck.map((card) => (
                card.ygoInfo.type.toLowerCase().includes('spell') && (
                  <CardImage
                    key={card.serialNumber}
                    serialNumber={card.serialNumber}
                    name={card.ygoInfo.name}
                    imageUrl={card.imageUrl}
                    count={card.copies}
                  />
                )
              ))}
            </div>
          </div>

          {/* Traps Section */}
          <div>
            <h3 className="text-sm text-white/60 mb-2">
              Traps ({mainDeck
                .filter(card => card.ygoInfo.type.toLowerCase().includes('trap'))
                .reduce((sum, card) => sum + card.copies, 0)})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {mainDeck.map((card) => (
                card.ygoInfo.type.toLowerCase().includes('trap') && (
                  <CardImage
                    key={card.serialNumber}
                    serialNumber={card.serialNumber}
                    name={card.ygoInfo.name}
                    imageUrl={card.ygoInfo.card_images[0]?.image_url}
                    count={card.copies}
                  />
                )
              ))}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="extra" className="space-y-4 h-full">
          <div className="h-full space-y-4">
            {/* Fusion Section */}
            {extraDeck.some(card => card.ygoInfo.type.toLowerCase().includes('fusion')) && (
              <div>
                <h3 className="text-sm text-white/60 mb-2">Fusion ({extraDeck
                  .filter(card => card.ygoInfo.type.toLowerCase().includes('fusion'))
                  .reduce((sum, card) => sum + card.copies, 0)})</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                  {extraDeck.map((card) => (
                    card.ygoInfo.type.toLowerCase().includes('fusion') && (
                      <CardImage
                        key={card.serialNumber}
                        serialNumber={card.serialNumber}
                        name={card.ygoInfo.name}
                        imageUrl={card.ygoInfo.card_images[0]?.image_url}
                        count={card.copies}
                      />
                    )
                  ))}
                </div>
              </div>
            )}

            {/* Synchro Section */}
            {extraDeck.some(card => card.ygoInfo.type.toLowerCase().includes('synchro')) && (
              <div>
                <h3 className="text-sm text-white/60 mb-2">Synchro ({extraDeck
                  .filter(card => card.ygoInfo.type.toLowerCase().includes('synchro'))
                  .reduce((sum, card) => sum + card.copies, 0)})</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                  {extraDeck.map((card) => (
                    card.ygoInfo.type.toLowerCase().includes('synchro') && (
                      <CardImage
                        key={card.serialNumber}
                        serialNumber={card.serialNumber}
                        name={card.ygoInfo.name}
                        imageUrl={card.ygoInfo.card_images[0]?.image_url}
                        count={card.copies}
                      />
                    )
                  ))}
                </div>
              </div>
            )}

            {/* XYZ Section */}
            {extraDeck.some(card => card.ygoInfo.type.toLowerCase().includes('xyz')) && (
              <div>
                <h3 className="text-sm text-white/60 mb-2">Xyz ({extraDeck
                  .filter(card => card.ygoInfo.type.toLowerCase().includes('xyz'))
                  .reduce((sum, card) => sum + card.copies, 0)})</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                  {extraDeck.map((card) => (
                    card.ygoInfo.type.toLowerCase().includes('xyz') && (
                      <CardImage
                        key={card.serialNumber}
                        serialNumber={card.serialNumber}
                        name={card.ygoInfo.name}
                        imageUrl={card.ygoInfo.card_images[0]?.image_url}
                        count={card.copies}
                      />
                    )
                  ))}
                </div>
              </div>
            )}

            {/* Link Section */}
            {extraDeck.some(card => card.ygoInfo.type.toLowerCase().includes('link')) && (
              <div>
                <h3 className="text-sm text-white/60 mb-2">Link ({extraDeck
                  .filter(card => card.ygoInfo.type.toLowerCase().includes('link'))
                  .reduce((sum, card) => sum + card.copies, 0)})</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                  {extraDeck.map((card) => (
                    card.ygoInfo.type.toLowerCase().includes('link') && (
                      <CardImage
                        key={card.serialNumber}
                        serialNumber={card.serialNumber}
                        name={card.ygoInfo.name}
                        imageUrl={card.ygoInfo.card_images[0]?.image_url}
                        count={card.copies}
                      />
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </div>
    </Tabs>
  );

  return (
    <div className="space-y-4">
      <Tabs 
        value={activeGame.toString()} 
        onValueChange={(value) => onGameChange(parseInt(value))}
        className="w-full"
      >
        <TabsList className="mb-4 bg-black/40 border border-white/10">
          {availableGames.map(game => (
            <TabsTrigger 
              key={game} 
              value={game.toString()}
              className="data-[state=active]:bg-white/10 text-white data-[state=active]:text-white"
            >
              Game {game}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={activeGame.toString()}>
          <DeckTabs />
        </TabsContent>
      </Tabs>
    </div>
  );
} 