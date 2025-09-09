import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import { Loader2, Mail } from "lucide-react";
import { useState } from "react";
import { useMutation } from "convex/react";
import { toast } from "sonner";

const languages = [
  "Spanish", "Mandarin", "Hindi", "Arabic", "Portuguese", "Bengali", 
  "Russian", "Japanese", "French", "German", "Korean", "Italian", 
  "Vietnamese", "Turkish", "Polish", "Dutch", "Other"
];

export default function WaitlistForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [nativeLanguage, setNativeLanguage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addToWaitlist = useMutation(api.waitlist.addToWaitlist);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !nativeLanguage) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    
    try {
      await addToWaitlist({
        name,
        email,
        nativeLanguage,
      });
      
      toast.success("Successfully joined the waitlist!");
      setName("");
      setEmail("");
      setNativeLanguage("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to join waitlist");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="bg-card border border-border rounded-2xl p-8 max-w-md mx-auto"
    >
      <div className="text-center mb-6">
        <Mail className="w-8 h-8 text-primary mx-auto mb-3" />
        <h3 className="text-xl font-bold tracking-tight mb-2">Join the Waitlist</h3>
        <p className="text-muted-foreground text-sm">
          Be the first to know when SpeakSharp launches
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name" className="text-sm font-medium">
            Full Name
          </Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="mt-1"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <Label htmlFor="email" className="text-sm font-medium">
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="mt-1"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <Label htmlFor="language" className="text-sm font-medium">
            Native Language
          </Label>
          <Select value={nativeLanguage} onValueChange={setNativeLanguage} disabled={isSubmitting}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select your native language" />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang} value={lang}>
                  {lang}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="submit"
          className="w-full font-medium"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Joining...
            </>
          ) : (
            "Join Waitlist"
          )}
        </Button>
      </form>
    </motion.div>
  );
}
