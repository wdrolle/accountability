import Image from "next/image";
import Link from "next/link";

export function MainHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-6 md:gap-8">
          {/* AI Agents Chat Logo & Title */}
          <div className="flex items-center gap-2">
            <Image
              src="/images/ai-tools/ai-agent.gif"
              alt="AI Agents"
              width={32}
              height={32}
              className="w-8 h-8 object-contain"
              priority
              onError={(e) => {
                console.error('Error loading image');
                e.currentTarget.style.display = 'none';
              }}
            />
            <span className="font-semibold">AI Agents Chat</span>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-6">
            <Link href="/" className="hover:text-foreground/80">
              Home
            </Link>
            <Link href="/about" className="hover:text-foreground/80">
              About
            </Link>
            <Link href="/blog" className="hover:text-foreground/80">
              Blog
            </Link>
            <Link href="/ai-services" className="hover:text-foreground/80">
              AI Services
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
} 