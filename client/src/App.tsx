import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import VocabularyList from "./pages/VocabularyList";
import VocabularyDetail from "./pages/VocabularyDetail";
import GrammarList from "@/pages/GrammarList";
import DataImport from "@/pages/DataImport";
import GrammarDetail from "@/pages/GrammarDetail";
import TestAutoRuby from "@/pages/TestAutoRuby";
import SceneList from "./pages/SceneList";
import SceneDetail from "./pages/SceneDetail";
import Review from "./pages/Review";
import AIAssistant from "./pages/AIAssistant";
import ImmersiveLearning from "./pages/ImmersiveLearning";
import ImmersiveDetail from "./pages/ImmersiveDetail";
import TestSwitch from "./pages/TestSwitch";
import Login from "./pages/Login";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/login"} component={Login} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/vocabulary"} component={VocabularyList} />
      <Route path={"/vocabulary/:id"} component={VocabularyDetail} />
      <Route path="/grammar" component={GrammarList} />
      <Route path="/admin/import" component={DataImport} />
      <Route path={"/grammar/:id"} component={GrammarDetail} />
      <Route path={"/scenes"} component={SceneList} />
      <Route path={"/scenes/:id"} component={SceneDetail} />
      <Route path={"/immersive"} component={ImmersiveLearning} />
        <Route path="/immersive/:id" component={ImmersiveDetail} />
        <Route path="/test-auto-ruby" component={TestAutoRuby} />
      <Route path={"/review"} component={Review} />
      <Route path={"/ai-assistant"} component={AIAssistant} />
      <Route path={"/test-switch"} component={TestSwitch} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
