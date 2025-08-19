import { useState } from "react";
import SignInForm from "@/components/auth/SignInForm";
import SignUpForm from "@/components/auth/SignUpForm";
import ChatApp from "@/pages/ChatApp";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState("");
  const { toast } = useToast();

  const handleSignIn = (email: string, password: string) => {
    // In a real app, this would validate credentials via GraphQL
    setUserName(email.split("@")[0]);
    setIsAuthenticated(true);
    toast({
      title: "Welcome back!",
      description: "You have successfully signed in.",
    });
  };

  const handleSignUp = (email: string, password: string, name: string) => {
    // In a real app, this would create account via GraphQL
    setUserName(name);
    setIsAuthenticated(true);
    toast({
      title: "Account created!",
      description: "Welcome to the chatbot application.",
    });
  };

  const handleSignOut = () => {
    setIsAuthenticated(false);
    setUserName("");
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
