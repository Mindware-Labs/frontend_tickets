"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LifeBuoy,
  Mail,
  Instagram,
  ExternalLink,
} from "lucide-react";

export default function SupportPage() {
  const gmailEmail = "labsmindware@gmail.com";
  const subject = "Support Request: Rig Hut";
  const body =
    "Hello Support Team,\n\nI need assistance with the following issue:\n\n";

  // Gmail Compose URL
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
    gmailEmail
  )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  const instagramUrl = "https://www.instagram.com/labsmindware/";

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <LifeBuoy className="h-8 w-8 text-primary" /> Support Center
        </h1>
        <p className="text-muted-foreground text-lg">
          Need help? Choose the channel that works best for you.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Email Support Card */}
        <Card className="border-primary/10 shadow-sm hover:border-primary/30 transition-all duration-300">
          <CardHeader>
            <div className="mb-2 h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Mail className="h-6 w-6" />
            </div>
            <CardTitle>Email Support</CardTitle>
            <CardDescription>
              Best for technical issues, bug reports, or detailed inquiries.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              Clicking the button below will open a pre-filled email draft in
              Gmail to help us understand your issue faster.
            </p>
            <ul className="list-disc list-inside pl-1 space-y-1">
              <li>Response time: Within 24 hours</li>
              <li>Detailed tracking</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full gap-2" asChild>
              <a href={gmailUrl} target="_blank" rel="noopener noreferrer">
                <Mail className="h-4 w-4" />
                Open in Gmail
                <ExternalLink className="h-3 w-3 opacity-50" />
              </a>
            </Button>
          </CardFooter>
        </Card>

        {/* Social Support Card */}
        <Card className="shadow-sm hover:border-pink-500/30 transition-all duration-300 group">
          <CardHeader>
            <div className="mb-2 h-12 w-12 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-600 group-hover:text-pink-500 transition-colors">
              <Instagram className="h-6 w-6" />
            </div>
            <CardTitle>Social Connect</CardTitle>
            <CardDescription>
              Follow us for updates or send a DM for quick questions.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              Reach out to us directly on Instagram. It's great for quick chats,
              community updates, and general questions.
            </p>
            <ul className="list-disc list-inside pl-1 space-y-1">
              <li>Instant messaging</li>
              <li>Community news</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              className="w-full gap-2 hover:bg-pink-500/5 hover:text-pink-600 hover:border-pink-200 dark:hover:border-pink-900"
              asChild
            >
              <a href={instagramUrl} target="_blank" rel="noopener noreferrer">
                <Instagram className="h-4 w-4" />
                Visit Instagram
                <ExternalLink className="h-3 w-3 opacity-50" />
              </a>
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Optional: Footer Note */}
      <div className="text-center pt-8 border-t">
        <p className="text-sm text-muted-foreground">
          Still having trouble? You can also email us directly at{" "}
          <span className="font-medium text-foreground select-all">
            {gmailEmail}
          </span>
        </p>
      </div>
    </div>
  );
}
