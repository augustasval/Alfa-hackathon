import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, BookOpen } from "lucide-react";
import { GradeTopicSelector, curriculumTopics } from "@/components/GradeTopicSelector";

interface TranscriptSegment {
  timestamp: string;
  seconds: number;
  text: string;
}

interface VideoLesson {
  id: string;
  title: string;
  youtubeId: string;
  description: string;
  transcript: TranscriptSegment[];
}

const videoLibrary: Record<string, VideoLesson[]> = {
  "6-fractions": [
    {
      id: "fractions-intro",
      title: "Introduction to Fractions",
      youtubeId: "FVrDHkoKj7M",
      description: "Learn the basics of fractions, numerators, and denominators.",
      transcript: [
        { timestamp: "0:00", seconds: 0, text: "Welcome to our lesson on fractions!" },
        { timestamp: "0:15", seconds: 15, text: "A fraction represents a part of a whole." },
        { timestamp: "0:45", seconds: 45, text: "The top number is called the numerator." },
        { timestamp: "1:20", seconds: 80, text: "The bottom number is the denominator." },
      ],
    },
  ],
  "9-quadratics": [
    {
      id: "quadratics-intro",
      title: "Understanding Quadratic Equations",
      youtubeId: "-JjFV3kk6pQ",
      description: "Master the fundamentals of quadratic equations and parabolas.",
      transcript: [
        { timestamp: "0:00", seconds: 0, text: "Quadratic equations have the form ax² + bx + c = 0" },
        { timestamp: "0:30", seconds: 30, text: "The graph of a quadratic is a parabola." },
        { timestamp: "1:15", seconds: 75, text: "We can solve using factoring, completing the square, or the quadratic formula." },
        { timestamp: "2:00", seconds: 120, text: "The discriminant tells us how many solutions we have." },
      ],
    },
    {
      id: "factoring-quadratics",
      title: "Factoring Quadratic Equations",
      youtubeId: "gTKZOJnJL6w",
      description: "Learn techniques for factoring quadratic expressions.",
      transcript: [
        { timestamp: "0:00", seconds: 0, text: "Factoring is one of the easiest ways to solve quadratics." },
        { timestamp: "0:40", seconds: 40, text: "Look for two numbers that multiply to c and add to b." },
        { timestamp: "1:30", seconds: 90, text: "Write the equation as (x + p)(x + q) = 0" },
      ],
    },
  ],
  "12-derivatives": [
    {
      id: "derivatives-intro",
      title: "Introduction to Derivatives",
      youtubeId: "rAof9Ld5sOg",
      description: "Learn the concept of derivatives and rates of change.",
      transcript: [
        { timestamp: "0:00", seconds: 0, text: "A derivative measures the rate of change." },
        { timestamp: "0:45", seconds: 45, text: "Geometrically, it's the slope of the tangent line." },
        { timestamp: "1:30", seconds: 90, text: "We use the limit definition: f'(x) = lim(h→0) [f(x+h) - f(x)]/h" },
        { timestamp: "2:30", seconds: 150, text: "The power rule: d/dx(x^n) = nx^(n-1)" },
      ],
    },
  ],
};

export default function VideoLibrary() {
  const [selectedGrade, setSelectedGrade] = useState("9");
  const [selectedTopic, setSelectedTopic] = useState("9-quadratics");
  const [currentVideo, setCurrentVideo] = useState<VideoLesson | null>(null);
  const [videoPlayer, setVideoPlayer] = useState<any>(null);

  const videos = videoLibrary[selectedTopic] || [];

  const playVideo = (video: VideoLesson) => {
    setCurrentVideo(video);
  };

  const seekToTimestamp = (seconds: number) => {
    if (videoPlayer) {
      videoPlayer.seekTo(seconds);
    }
  };

  const onPlayerReady = (event: any) => {
    setVideoPlayer(event.target);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <main className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex flex-col gap-6">
          <Navigation />
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Video Library</h1>
            <p className="text-muted-foreground">
              Watch comprehensive lessons with interactive transcripts
            </p>
          </div>

          <div className="mb-8">
            <GradeTopicSelector
              selectedGrade={selectedGrade}
              selectedTopic={selectedTopic}
              onGradeChange={(grade) => {
                setSelectedGrade(grade);
                const topics = curriculumTopics[grade];
                if (topics && topics.length > 0) {
                  setSelectedTopic(topics[0].id);
                }
              }}
              onTopicChange={setSelectedTopic}
            />
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Video List */}
            <div className="md:col-span-1 space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Available Lessons
              </h2>
              {videos.length === 0 ? (
                <Card className="p-6 text-center text-muted-foreground">
                  No videos available for this topic yet. Check back soon!
                </Card>
              ) : (
                videos.map((video) => (
                  <Card
                    key={video.id}
                    className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
                      currentVideo?.id === video.id ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => playVideo(video)}
                  >
                    <div className="flex items-start gap-3">
                      <Play className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-sm">{video.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {video.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>

            {/* Video Player & Transcript */}
            <div className="md:col-span-2 space-y-4">
              {currentVideo ? (
                <>
                  <Card className="p-4">
                    <h2 className="text-xl font-semibold mb-4">{currentVideo.title}</h2>
                    <div className="aspect-video bg-black rounded-lg overflow-hidden">
                      <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${currentVideo.youtubeId}?enablejsapi=1`}
                        title={currentVideo.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        onLoad={(e) => {
                          const iframe = e.target as HTMLIFrameElement;
                          const player = new (window as any).YT.Player(iframe, {
                            events: {
                              onReady: onPlayerReady,
                            },
                          });
                        }}
                      ></iframe>
                    </div>
                    <p className="text-sm text-muted-foreground mt-4">
                      {currentVideo.description}
                    </p>
                  </Card>

                  <Card className="p-4">
                    <h3 className="font-semibold mb-4">Interactive Transcript</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {currentVideo.transcript.map((segment, idx) => (
                        <Button
                          key={idx}
                          variant="ghost"
                          className="w-full justify-start text-left h-auto py-2 hover:bg-primary/10"
                          onClick={() => seekToTimestamp(segment.seconds)}
                        >
                          <span className="font-mono text-xs text-primary mr-3 flex-shrink-0">
                            {segment.timestamp}
                          </span>
                          <span className="text-sm">{segment.text}</span>
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">
                      Tip: Click any timestamp to jump to that part of the video
                    </p>
                  </Card>
                </>
              ) : (
                <Card className="p-12 text-center">
                  <Play className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Select a video from the list to start learning
                  </p>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Load YouTube IFrame API */}
      <script src="https://www.youtube.com/iframe_api"></script>
    </div>
  );
}
