import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface ScriptureResult {
  reference: string;
  content: string;
}

interface ScriptureSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (scripture: string, reference: string) => void;
}

export default function ScriptureSearchModal({ isOpen, onClose, onSelect }: ScriptureSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [activeTab, setActiveTab] = useState("Prayer & Seeking God");
  const { toast } = useToast();

  const { data: searchResults = [], isLoading, error } = useQuery({
    queryKey: ["/api/scripture/search", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      
      const response = await fetch(`/api/scripture/search?q=${encodeURIComponent(searchQuery)}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Scripture search failed");
      }
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        return data.results.map((result: any) => ({
          reference: result.reference,
          content: result.content.replace(/\s+/g, ' ').trim(),
        }));
      }
      
      return [];
    },
    enabled: isOpen && searchQuery.trim().length > 0 && hasSearched,
  });

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Search Required",
        description: "Please enter a search term",
        variant: "destructive",
      });
      return;
    }
    setHasSearched(true);
  };

  const handleClose = () => {
    setSearchQuery("");
    setHasSearched(false);
    onClose();
  };

  const handleSelect = (scripture: string, reference: string) => {
    onSelect(scripture, reference);
    handleClose();
  };

  // Comprehensive collection of authentic Bible prayer verses organized by categories
  const scriptureCategories = {
    "Prayer & Seeking God": [
      {
        reference: "Philippians 4:6-7",
        content: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus."
      },
      {
        reference: "1 Thessalonians 5:16-18",
        content: "Rejoice always, pray without ceasing, give thanks in all circumstances; for this is the will of God in Christ Jesus for you."
      },
      {
        reference: "Psalm 27:4",
        content: "One thing I ask from the Lord, this only do I seek: that I may dwell in the house of the Lord all the days of my life, to gaze on the beauty of the Lord and to seek him in his temple."
      },
      {
        reference: "Psalm 63:1",
        content: "You, God, are my God, earnestly I seek you; I thirst for you, my whole being longs for you, in a dry and parched land where there is no water."
      },
      {
        reference: "Psalm 37:4",
        content: "Take delight in the Lord, and he will give you the desires of your heart."
      }
    ],

    "Faith & Trust": [
      {
        reference: "Matthew 17:19-20",
        content: "Then the disciples came to Jesus in private and asked, 'Why couldn't we drive it out?' He replied, 'Because you have so little faith. Truly I tell you, if you have faith as small as a mustard seed, you can say to this mountain, 'Move from here to there,' and it will move. Nothing will be impossible for you.'"
      },
      {
        reference: "Mark 9:22-24",
        content: "But if you can do anything, take pity on us and help us. 'If you can?' said Jesus. 'Everything is possible for one who believes.' Immediately the boy's father exclaimed, 'I do believe; help me overcome my unbelief!'"
      },
      {
        reference: "Luke 22:32",
        content: "But I have prayed for you, Simon, that your faith may not fail. And when you have turned back, strengthen your brothers."
      },
      {
        reference: "Romans 4:19-20",
        content: "Without weakening in his faith, he faced the fact that his body was as good as dead—since he was about a hundred years old—and that Sarah's womb was also dead. Yet he did not waver through unbelief regarding the promise of God, but was strengthened in his faith and gave glory to God."
      },
      {
        reference: "Hebrews 11:1, 6",
        content: "Now faith is confidence in what we hope for and assurance about what we do not see... And without faith it is impossible to please God, because anyone who comes to him must believe that he exists and that he rewards those who earnestly seek him."
      }
    ],

    "Children & Family": [
      {
        reference: "3 John 2",
        content: "Dear friend, I pray that you may enjoy good health and that all may go well with you, even as your soul is getting along well."
      },
      {
        reference: "Ephesians 6:1",
        content: "Children, obey your parents in the Lord, for this is right."
      },
      {
        reference: "Isaiah 49:25",
        content: "But this is what the Lord says: 'Yes, captives will be taken from warriors, and plunder retrieved from the fierce; I will contend with those who contend with you, and your children I will save.'"
      },
      {
        reference: "Isaiah 59:21",
        content: "As for me, this is my covenant with them,' says the Lord. 'My Spirit, who is on you, will not depart from you, and my words that I have put in your mouth will always be on your lips, on the lips of your children and on the lips of their descendants—from this time on and forever,' says the Lord."
      },
      {
        reference: "Isaiah 43:6",
        content: "I will say to the north, 'Give them up!' and to the south, 'Do not hold them back.' Bring my sons from afar and my daughters from the ends of the earth."
      },
      {
        reference: "Psalm 127:3",
        content: "Children are a heritage from the Lord, offspring a reward from him."
      }
    ],

    "Marriage & Relationships": [
      {
        reference: "Isaiah 62:4",
        content: "No longer will they call you Deserted, or name your land Desolate. But you will be called Hephzibah, and your land Beulah; for the Lord will take delight in you, and your land will be married."
      },
      {
        reference: "Ephesians 5:25",
        content: "Husbands, love your wives, just as Christ loved the church and gave himself up for her."
      },
      {
        reference: "1 Peter 3:7",
        content: "Husbands, in the same way be considerate as you live with your wives, and treat them with respect as the weaker partner and as heirs with you of the gracious gift of life, so that nothing will hinder your prayers."
      },
      {
        reference: "Colossians 3:19",
        content: "Husbands, love your wives and do not be harsh with them."
      },
      {
        reference: "Proverbs 27:17",
        content: "As iron sharpens iron, so one person sharpens another."
      }
    ],

    "Healing & Health": [
      {
        reference: "Psalm 103:1-5",
        content: "Praise the Lord, my soul; all my inmost being, praise his holy name. Praise the Lord, my soul, and forget not all his benefits—who forgives all your sins and heals all your diseases, who redeems your life from the pit and crowns you with love and compassion, who satisfies your desires with good things so that your youth is renewed like the eagle's."
      },
      {
        reference: "Isaiah 38:16-17",
        content: "Lord, by such things people live; and my spirit finds life in them too. You restored me to health and let me live. Surely it was for my benefit that I suffered such anguish. In your love you kept me from the pit of destruction; you have put all my sins behind your back."
      },
      {
        reference: "Psalm 41:3",
        content: "The Lord sustains them on their sickbed and restores them from their bed of illness."
      },
      {
        reference: "Jeremiah 17:14",
        content: "Heal me, Lord, and I will be healed; save me and I will be saved, for you are the one I praise."
      }
    ],

    "Work & Vocation": [
      {
        reference: "Colossians 3:23",
        content: "Whatever you do, work at it with all your heart, as working for the Lord, not for human masters."
      },
      {
        reference: "Ephesians 6:5-8",
        content: "Slaves, obey your earthly masters with respect and fear, and with sincerity of heart, just as you would obey Christ. Obey them not only to win their favor when their eye is on you, but as slaves of Christ, doing the will of God from your heart."
      },
      {
        reference: "Proverbs 16:9",
        content: "In their hearts humans plan their course, but the Lord establishes their steps."
      },
      {
        reference: "1 Timothy 6:1",
        content: "All who are under the yoke of slavery should consider their masters worthy of full respect, so that God's name and our teaching may not be slandered."
      }
    ],

    "Non-Believers & Evangelism": [
      {
        reference: "Isaiah 52:7",
        content: "How beautiful on the mountains are the feet of those who bring good news, who proclaim peace, who bring good tidings, who proclaim salvation, who say to Zion, 'Your God reigns!'"
      },
      {
        reference: "Romans 2:4",
        content: "Or do you show contempt for the riches of his kindness, forbearance and patience, not realizing that God's kindness is intended to lead you to repentance?"
      },
      {
        reference: "2 Corinthians 4:4-6",
        content: "The god of this age has blinded the minds of unbelievers, so that they cannot see the light of the gospel that displays the glory of Christ, who is the image of God. For what we preach is not ourselves, but Jesus Christ as Lord, and ourselves as your servants for Jesus' sake."
      },
      {
        reference: "2 Peter 3:9",
        content: "The Lord is not slow in keeping his promise, as some understand slowness. Instead he is patient with you, not wanting anyone to perish, but everyone to come to repentance."
      },
      {
        reference: "Colossians 4:5-6",
        content: "Be wise in the way you act toward outsiders; make the most of every opportunity. Let your conversation be always full of grace, seasoned with salt, so that you may know how to answer everyone."
      }
    ],

    "Protection & Safety": [
      {
        reference: "Psalm 91:1-2",
        content: "Whoever dwells in the shelter of the Most High will rest in the shadow of the Almighty. I will say of the Lord, 'He is my refuge and my fortress, my God, in whom I trust.'"
      },
      {
        reference: "Psalm 121:7-8",
        content: "The Lord will keep you from all harm—he will watch over your life; the Lord will watch over your coming and going both now and forevermore."
      },
      {
        reference: "Isaiah 43:2",
        content: "When you pass through the waters, I will be with you; and when you pass through the rivers, they will not sweep over you. When you walk through the fire, you will not be burned; the flames will not set you ablaze."
      },
      {
        reference: "Psalm 32:7",
        content: "You are my hiding place; you will protect me from trouble and surround me with songs of deliverance."
      }
    ],

    "Forgiveness & Repentance": [
      {
        reference: "Isaiah 44:22",
        content: "I have swept away your offenses like a cloud, your sins like the morning mist. Return to me, for I have redeemed you."
      },
      {
        reference: "Psalm 103:12",
        content: "As far as the east is from the west, so far has he removed our transgressions from us."
      },
      {
        reference: "1 John 1:9",
        content: "If we confess our sins, he is faithful and just and will forgive us our sins and purify us from all unrighteousness."
      },
      {
        reference: "Ephesians 4:32",
        content: "Be kind and compassionate to one another, forgiving each other, just as in Christ God forgave you."
      }
    ],

    "Wisdom & Guidance": [
      {
        reference: "Proverbs 3:5-6",
        content: "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight."
      },
      {
        reference: "James 1:5",
        content: "If any of you lacks wisdom, you should ask God, who gives generously to all without finding fault, and it will be given to you."
      },
      {
        reference: "Psalm 119:105",
        content: "Your word is a lamp for my feet, a light on my path."
      },
      {
        reference: "Isaiah 42:16",
        content: "I will lead the blind by ways they have not known, along unfamiliar paths I will guide them; I will turn the darkness into light before them and make the rough places smooth. These are the things I will do; I will not forsake them."
      }
    ],

    "Strength & Comfort": [
      {
        reference: "Isaiah 40:31",
        content: "But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint."
      },
      {
        reference: "2 Corinthians 1:3-4",
        content: "Praise be to the God and Father of our Lord Jesus Christ, the Father of compassion and the God of all comfort, who comforts us in all our troubles, so that we can comfort those in any trouble with the comfort we ourselves receive from God."
      },
      {
        reference: "Psalm 34:18",
        content: "The Lord is close to the brokenhearted and saves those who are crushed in spirit."
      },
      {
        reference: "Isaiah 61:1-3",
        content: "The Spirit of the Sovereign Lord is on me, because the Lord has anointed me to proclaim good news to the poor. He has sent me to bind up the brokenhearted, to proclaim freedom for the captives and release from darkness for the prisoners, to proclaim the year of the Lord's favor and the day of vengeance of our God, to comfort all who mourn, and provide for those who grieve in Zion—to bestow on them a crown of beauty instead of ashes, the oil of joy instead of mourning, and a garment of praise instead of a spirit of despair."
      }
    ],

    "World Events & Global Issues": [
      {
        reference: "1 Chronicles 16:24",
        content: "Declare his glory among the nations, his marvelous deeds among all peoples."
      },
      {
        reference: "Psalm 67:1-3",
        content: "May God be gracious to us and bless us and make his face shine on us—so that your ways may be known on earth, your salvation among all nations. May the peoples praise you, God; may all the peoples praise you."
      },
      {
        reference: "1 Timothy 2:1-2",
        content: "I urge, then, first of all, that petitions, prayers, intercession and thanksgiving be made for all people—for kings and all those in authority, that we may live peaceful and quiet lives in all godliness and holiness."
      },
      {
        reference: "Psalm 46:10",
        content: "Be still, and know that I am God; I will be exalted among the nations, I will be exalted in the earth."
      }
    ],

    "Courage & Strength": [
      {
        reference: "Joshua 1:9",
        content: "Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go."
      },
      {
        reference: "Psalm 27:1",
        content: "The Lord is my light and my salvation—whom shall I fear? The Lord is the stronghold of my life—of whom shall I be afraid?"
      }
    ],

    "Family & Relationships": [
      {
        reference: "Joshua 24:15",
        content: "But as for me and my household, we will serve the Lord."
      },
      {
        reference: "Proverbs 17:17",
        content: "A friend loves at all times, and a brother is born for a time of adversity."
      },
      {
        reference: "1 Timothy 2:1-2",
        content: "I urge, then, first of all, that petitions, prayers, intercession and thanksgiving be made for all people—for kings and all those in authority, that we may live peaceful and quiet lives in all godliness and holiness."
      },
      {
        reference: "Luke 6:28",
        content: "Bless those who curse you, pray for those who mistreat you."
      },
      {
        reference: "Matthew 5:44",
        content: "But I tell you, love your enemies and pray for those who persecute you."
      }
    ],

    "Provision & Needs": [
      {
        reference: "Matthew 6:26",
        content: "Look at the birds of the air; they do not sow or reap or store away in barns, and yet your heavenly Father feeds them. Are you not much more valuable than they?"
      },
      {
        reference: "Philippians 4:19",
        content: "And my God will meet all your needs according to the riches of his glory in Christ Jesus."
      },
      {
        reference: "Philippians 4:13",
        content: "I can do all this through him who gives me strength."
      }
    ],

    "Thanksgiving & Praise": [
      {
        reference: "Psalm 100:4-5",
        content: "Enter his gates with thanksgiving and his courts with praise; give thanks to him and praise his name. For the Lord is good and his love endures forever; his faithfulness continues through all generations."
      },
      {
        reference: "Psalm 136:1",
        content: "Give thanks to the Lord, for he is good. His love endures forever."
      },
      {
        reference: "Ephesians 1:3",
        content: "Praise be to the God and Father of our Lord Jesus Christ, who has blessed us in the heavenly realms with every spiritual blessing in Christ."
      },
      {
        reference: "1 Chronicles 16:34",
        content: "Give thanks to the Lord, for he is good; his love endures forever."
      }
    ],

    "Hope & Future": [
      {
        reference: "Jeremiah 29:11",
        content: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, to give you hope and a future."
      },
      {
        reference: "Romans 8:28",
        content: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose."
      },
      {
        reference: "Psalm 42:11",
        content: "Why, my soul, are you downcast? Why so disturbed within me? Put your hope in God, for I will yet praise him, my Savior and my God."
      }
    ]
  };

  // Convert categories to flat array for search compatibility
  const fallbackVerses = Object.values(scriptureCategories).flat();

  const displayResults = hasSearched ? (error ? fallbackVerses : searchResults) : fallbackVerses;
  const filteredResults = searchQuery.trim() 
    ? displayResults.filter((verse: ScriptureResult) => 
        verse.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        verse.reference.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : displayResults;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center pb-6 border-b border-gray-200">
          <DialogTitle className="text-3xl font-bold text-prayer-dark flex items-center justify-center gap-3">
            Scripture Search
          </DialogTitle>
          <DialogDescription className="text-prayer-gray">
            Search and select Bible verses to attach to your prayer card
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex space-x-4">
            <Input
              type="text"
              placeholder="Search for keywords, topics, or specific verses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
            />
            <Button 
              onClick={handleSearch}
              disabled={isLoading}
              className="bg-[#e81c32] hover:bg-[#e81c32]/90"
            >
              {isLoading ? "Searching..." : "Search"}
            </Button>
          </div>

          {error && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                Scripture API is not available. Showing popular verses instead.
              </p>
            </div>
          )}

          {/* Search Results */}
          <div className="space-y-6">
            {searchQuery.trim() ? (
              // Show filtered search results
              filteredResults.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-prayer-gray">No verses found matching your search.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredResults.map((verse: ScriptureResult, index: number) => (
                    <div 
                      key={`${verse.reference}-${index}`}
                      className="bg-prayer-soft rounded-lg p-4 cursor-pointer hover:bg-prayer-blue/5 transition-colors"
                      onClick={() => handleSelect(verse.content, verse.reference)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-prayer-dark mb-2">{verse.reference}</h4>
                          <p className="text-prayer-gray leading-relaxed">{verse.content}</p>
                        </div>
                        <Button
                          size="sm"
                          className="ml-4 bg-[#e81c32] hover:bg-[#e81c32]/90"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelect(verse.content, verse.reference);
                          }}
                        >
                          Select
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              // Show categorized scripture verses with tabs
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <div className="border-b border-gray-200">
                  <TabsList className="flex flex-wrap justify-center gap-2 h-auto p-2 bg-transparent">
                    {Object.keys(scriptureCategories).map((categoryName) => (
                      <TabsTrigger
                        key={categoryName}
                        value={categoryName}
                        className="px-4 py-2 text-sm font-medium rounded-full border border-gray-300 hover:border-[#e81c32] hover:text-[#e81c32] transition-all data-[state=active]:bg-[#e81c32] data-[state=active]:text-white data-[state=active]:border-[#e81c32] data-[state=inactive]:bg-white data-[state=inactive]:text-gray-700"
                      >
                        {categoryName}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
                
                {Object.entries(scriptureCategories).map(([categoryName, verses]) => (
                  <TabsContent key={categoryName} value={categoryName} className="space-y-3 mt-4">
                    <div className="space-y-3">
                      {verses.map((verse: ScriptureResult, index: number) => (
                        <div 
                          key={`${categoryName}-${verse.reference}-${index}`}
                          className="bg-prayer-soft rounded-lg p-4 cursor-pointer hover:bg-prayer-blue/5 transition-colors"
                          onClick={() => handleSelect(verse.content, verse.reference)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-prayer-dark mb-2">{verse.reference}</h4>
                              <p className="text-prayer-gray leading-relaxed">{verse.content}</p>
                            </div>
                            <Button
                              size="sm"
                              className="ml-4 bg-[#e81c32] hover:bg-[#e81c32]/90"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelect(verse.content, verse.reference);
                              }}
                            >
                              Select
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}