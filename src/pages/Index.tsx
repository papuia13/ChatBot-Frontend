import { useState } from "react";
import SignInForm from "@/components/auth/SignInForm";
import SignUpForm from "@/components/auth/SignUpForm";
import ChatApp from "@/pages/ChatApp";
import { useToast } from "@/hooks/use-toast";
import nhost from "@/lib/nhost";
import { useAuthenticationStatus, useUserData } from "@nhost/react";

const Index = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const { isAuthenticated } = useAuthenticationStatus();
  const user = useUserData();
  const userEmail = user?.email || "";
  const metaName = (user as any)?.metadata?.displayName as string | undefined;
  const directDisplay = (user?.displayName as string | undefined);
  const userDisplayName = metaName || directDisplay || (userEmail ? userEmail.split("@")[0] : "");
  const { toast } = useToast();

  const handleSignIn = async (email: string, password: string) => {
    const { error } = await nhost.auth.signIn({ email, password });
    if (error) {
      toast({ title: "Sign in failed", description: error.message });
      return;
    }
  };

  const handleSignUp = async (email: string, password: string, name: string) => {
    const { error } = await nhost.auth.signUp({
      email,
      password,
      options: { metadata: { displayName: name } },
    });
    if (error) {
      toast({ title: "Sign up failed", description: error.message });
      return;
    }
    toast({
      title: "Verify your email",
      description:
        "We've sent a verification link to your email. Please check your Inbox and Spam folder. You cannot sign in until your email is verified.",
    });
    // Redirect to sign-in after sending verification
    setIsSignUp(false);
  };

  const handleSignOut = () => {
    nhost.auth.signOut();
  };

  if (isAuthenticated) {
    return (
      <ChatApp
        userDisplayName={userDisplayName}
        userEmail={userEmail}
        onSignOut={handleSignOut}
      />
    );
  }

  return isSignUp ? (
    <SignUpForm 
      onSwitchToSignIn={() => setIsSignUp(false)}
      onSignUp={handleSignUp}
    />
  ) : (
    <SignInForm 
      onSwitchToSignUp={() => setIsSignUp(true)}
      onSignIn={handleSignIn}
    />
  );
};

export default Index;
