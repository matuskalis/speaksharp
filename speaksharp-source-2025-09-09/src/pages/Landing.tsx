import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import WaitlistForm from "@/components/WaitlistForm";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle, Mic, Play, Star, Users, Download } from "lucide-react";
import { Link } from "react-router";
import { useState } from "react";
import { sourceFiles } from "@/export/sourceFiles";

const testimonials = [
  {
    name: "Maria Rodriguez",
    role: "Software Engineer", 
    content: "SpeakSharp helped me improve my pronunciation in just 2 weeks. My confidence in meetings has skyrocketed!",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=64&h=64&fit=crop&crop=face"
  },
  {
    name: "Chen Wei",
    role: "Product Manager",
    content: "The AI feedback is incredibly detailed. I finally understand why my 'th' sounds weren't clear.",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face"
  },
  {
    name: "Priya Patel",
    role: "Marketing Director",
    content: "Game-changer for my presentations. The real-time analysis helped me speak more clearly and confidently.",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=face"
  }
];

const steps = [
  {
    icon: Mic,
    title: "Record Your Speech",
    description: "Speak naturally into your microphone for 60 seconds"
  },
  {
    icon: Play,
    title: "AI Analysis", 
    description: "Our advanced AI analyzes your pronunciation and clarity"
  },
  {
    icon: CheckCircle,
    title: "Get Feedback",
    description: "Receive detailed insights and personalized improvement tips"
  }
];

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const [isZipping, setIsZipping] = useState(false);

  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);

      const JSZip = (await import("jszip")).default;

      const zip = new JSZip();

      for (const [path, content] of Object.entries(sourceFiles)) {
        zip.file(path, content);
      }

      const rootTextFiles = ["README.md", "index.html", "package.json", "components.json"];
      for (const file of rootTextFiles) {
        try {
          const res = await fetch(`/${file}`);
          if (res.ok) {
            const text = await res.text();
            zip.file(file, text);
          }
        } catch {
          // ignore missing files
        }
      }

      const publicBinaryFiles = [
        "public/logo.png",
        "public/logo.svg",
        "public/logo_bg.png",
        "public/logo_bg.svg",
      ];
      for (const file of publicBinaryFiles) {
        try {
          // Vite serves files from /public at the root, e.g. /logo.png
          const res = await fetch(`/${file.replace("public/", "")}`);
          if (res.ok) {
            const buf = await res.arrayBuffer();
            zip.file(file, new Uint8Array(buf), { binary: true });
          }
        } catch {
          // ignore missing files
        }
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `speaksharp-source-${new Date().toISOString().split("T")[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Zip generation failed:", e);
      alert("Failed to generate zip. Please try again.");
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
              AI Speech Coach for{" "}
              <span className="text-primary">Clear English</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Master English pronunciation with personalized AI feedback. 
              Get instant analysis of your speech patterns and improve your clarity in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/demo">
                <Button size="lg" className="text-lg px-8 py-6 font-medium">
                  Start 60-sec Demo
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              {!isAuthenticated && (
                <Link to="/auth">
                  <Button variant="outline" size="lg" className="text-lg px-8 py-6 font-medium">
                    Sign Up Free
                  </Button>
                </Link>
              )}
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 py-6 font-medium"
                onClick={handleDownloadZip}
                disabled={isZipping}
              >
                <Download className="mr-2 w-5 h-5" />
                {isZipping ? "Preparing..." : "Download Source"}
              </Button>
            </div>
          </motion.div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get professional speech coaching in three simple steps
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <Card className="text-center p-8 h-full border-border/50 hover:border-primary/20 transition-colors">
                  <CardContent className="pt-6">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <step.icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 tracking-tight">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Loved by Professionals
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join thousands who've improved their English pronunciation
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <Card className="p-6 h-full border-border/50">
                  <CardContent className="pt-0">
                    <div className="flex items-center mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                      "{testimonial.content}"
                    </p>
                    <div className="flex items-center">
                      <img
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        className="w-10 h-10 rounded-full mr-3"
                      />
                      <div>
                        <p className="font-medium text-sm">{testimonial.name}</p>
                        <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Waitlist Section */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Be First in Line
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join our waitlist to get early access and exclusive updates
            </p>
          </motion.div>

          <WaitlistForm />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Mic className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold tracking-tight">SpeakSharp</span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <span className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                Trusted by professionals worldwide
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}