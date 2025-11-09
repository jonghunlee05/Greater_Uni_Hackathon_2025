import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface FirstAidInstructionsProps {
  instructions: string;
}

export function FirstAidInstructions({ instructions }: FirstAidInstructionsProps) {
  // Parse and format the instructions
  const formatInstructions = (text: string) => {
    // Split into lines
    const lines = text.split('\n').filter(line => line.trim());
    const formatted: JSX.Element[] = [];
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Handle numbered lists
      if (/^\d+\./.test(trimmedLine)) {
        const content = trimmedLine.replace(/^\d+\.\s*/, '');
        formatted.push(
          <div key={index} className="flex items-start gap-3 mb-3">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold mt-0.5">
              {trimmedLine.match(/^\d+/)?.[0]}
            </div>
            <p className="flex-1 text-foreground leading-relaxed">{formatTextContent(content)}</p>
          </div>
        );
      }
      // Handle bullet points
      else if (trimmedLine.startsWith('*') || trimmedLine.startsWith('-') || trimmedLine.startsWith('•')) {
        const content = trimmedLine.replace(/^[*\-•]\s*/, '');
        formatted.push(
          <div key={index} className="flex items-start gap-3 mb-2 ml-4">
            <CheckCircle className="flex-shrink-0 w-5 h-5 text-success mt-0.5" />
            <p className="flex-1 text-foreground leading-relaxed">{formatTextContent(content)}</p>
          </div>
        );
      }
      // Handle headers (lines that end with colon or are all caps)
      else if (trimmedLine.endsWith(':') || /^[A-Z\s]+:?$/.test(trimmedLine)) {
        formatted.push(
          <h3 key={index} className="font-semibold text-primary text-lg mt-4 mb-2">
            {formatTextContent(trimmedLine)}
          </h3>
        );
      }
      // Regular paragraph
      else if (trimmedLine) {
        formatted.push(
          <p key={index} className="text-foreground leading-relaxed mb-3">
            {formatTextContent(trimmedLine)}
          </p>
        );
      }
    });
    
    return formatted;
  };

  // Format text content (handle bold, emphasis, etc.)
  const formatTextContent = (text: string) => {
    const parts: (string | JSX.Element)[] = [];
    let currentIndex = 0;
    
    // Handle **bold** and *italic* markdown
    const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > currentIndex) {
        parts.push(text.substring(currentIndex, match.index));
      }
      
      const matchedText = match[0];
      // Handle bold
      if (matchedText.startsWith('**') && matchedText.endsWith('**')) {
        parts.push(
          <strong key={match.index} className="font-semibold text-primary">
            {matchedText.slice(2, -2)}
          </strong>
        );
      }
      // Handle italic
      else if (matchedText.startsWith('*') && matchedText.endsWith('*')) {
        parts.push(
          <em key={match.index} className="italic">
            {matchedText.slice(1, -1)}
          </em>
        );
      }
      
      currentIndex = match.index + matchedText.length;
    }
    
    // Add remaining text
    if (currentIndex < text.length) {
      parts.push(text.substring(currentIndex));
    }
    
    return parts.length > 0 ? parts : text;
  };

  return (
    <Card className="border-primary shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
        <CardTitle className="text-primary flex items-center gap-2">
          <span className="text-2xl">⚕️</span>
          First-Aid Instructions
        </CardTitle>
        <CardDescription>Follow these steps carefully while waiting for the ambulance</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-2">
          {formatInstructions(instructions)}
        </div>
        
        <Alert className="mt-6 border-critical/30 bg-critical/5">
          <AlertCircle className="h-5 w-5 text-critical" />
          <AlertDescription className="text-sm">
            <strong className="text-critical">Important:</strong> These are temporary first-aid measures. 
            Professional medical help is on the way. Do not attempt anything beyond your capabilities.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
