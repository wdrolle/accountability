import Link from "next/link";
import Image from "next/image";

export default function AccessRequired() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="text-center max-w-2xl mx-auto">
        <div className="mb-8 relative w-40 h-40 mx-auto">
          <Image
            src="/images/login/A serene sunrise.webp"
            alt="Access Required"
            fill
            className="object-cover rounded-full"
          />
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Join Our Community
        </h1>
        
        <p className="text-lg text-white/80 mb-8">
          This content is exclusively available to our registered members. Sign up to unlock access to our spiritual guidance, community discussions, and more.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/auth/signup"
            className="hero-button-gradient px-8 py-3 rounded-lg font-medium text-white hover:opacity-90 transition-opacity"
          >
            Sign Up Now
          </Link>
          <Link
            href="/auth/login"
            className="px-8 py-3 rounded-lg font-medium text-white border border-white/20 hover:bg-white/5 transition-colors"
          >
            Log In
          </Link>
        </div>
        
        <p className="mt-8 text-white/60 text-sm">
          Already have an account? <Link href="/auth/login" className="text-purple hover:underline">Log In here</Link>
        </p>
      </div>
    </div>
  );
} 