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
  const userName =
    (user?.displayName as string | undefined) ||
    (user?.email ? user.email.split("@")[0] : "");
  const { toast } = useToast();

  const handleSignIn = async (email: string, password: string) => {
    const { error } = await nhost.auth.signIn({ email, password });
    if (error) {
      toast({ title: "Sign in failed", description: error.message });
      return;
    }
    toast({ title: "Welcome back!", description: "You have successfully signed in." });
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
    toast({ title: "Account created!", description: "Check your email if verification is required." });
  };

  const handleSignOut = () => {
    nhost.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
  };

  if (isAuthenticated) {
    return <ChatApp userName={userName} onSignOut={handleSignOut} />;
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
