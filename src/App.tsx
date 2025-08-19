import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import nhost from "@/lib/nhost";
import { NhostProvider } from "@nhost/react";
import { NhostUrqlProvider } from "@nhost/react-urql";
import JwtButton from "@/components/dev/JwtButton";

const queryClient = new QueryClient();

const App = () => (
  <NhostProvider nhost={nhost}>
    <NhostUrqlProvider nhost={nhost}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          {import.meta.env.DEV && <JwtButton />}
        </TooltipProvider>
      </QueryClientProvider>
    </NhostUrqlProvider>
  </NhostProvider>
);

export default App;
