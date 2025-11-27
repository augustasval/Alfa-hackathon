import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { removeBackground, loadImage } from "@/lib/backgroundRemoval";
import { toast } from "sonner";

const LogoProcessor = () => {
  const [processing, setProcessing] = useState(false);
  const [processedLogo, setProcessedLogo] = useState<string | null>(null);
  const [processedName, setProcessedName] = useState<string | null>(null);

  const processLogos = async () => {
    setProcessing(true);
    toast.info("Processing logos... This may take a minute.");

    try {
      // Process logo
      const logoResponse = await fetch("/logo/logo.png");
      const logoBlob = await logoResponse.blob();
      const logoImage = await loadImage(logoBlob);
      const processedLogoBlob = await removeBackground(logoImage);
      const logoUrl = URL.createObjectURL(processedLogoBlob);
      setProcessedLogo(logoUrl);

      // Process brand name
      const nameResponse = await fetch("/name/brand-name.png");
      const nameBlob = await nameResponse.blob();
      const nameImage = await loadImage(nameBlob);
      const processedNameBlob = await removeBackground(nameImage);
      const nameUrl = URL.createObjectURL(processedNameBlob);
      setProcessedName(nameUrl);

      toast.success("Logos processed! Right-click to save each image.");
    } catch (error) {
      console.error("Error processing logos:", error);
      toast.error("Failed to process logos. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-4">Logo Background Remover</h1>
          <p className="text-muted-foreground mb-6">
            Process the Jolvita logos to remove white backgrounds
          </p>

          <Button onClick={processLogos} disabled={processing} className="mb-6">
            {processing ? "Processing..." : "Remove Backgrounds"}
          </Button>

          {(processedLogo || processedName) && (
            <div className="space-y-6">
              {processedLogo && (
                <div>
                  <h3 className="font-semibold mb-2">Logo (Right-click → Save as "logo.png")</h3>
                  <div className="bg-gray-100 p-4 rounded inline-block">
                    <img src={processedLogo} alt="Processed Logo" className="h-32" />
                  </div>
                </div>
              )}

              {processedName && (
                <div>
                  <h3 className="font-semibold mb-2">Brand Name (Right-click → Save as "brand-name.png")</h3>
                  <div className="bg-gray-100 p-4 rounded inline-block">
                    <img src={processedName} alt="Processed Brand Name" className="h-32" />
                  </div>
                </div>
              )}

              <div className="text-sm text-muted-foreground">
                <p className="font-semibold">Instructions:</p>
                <ol className="list-decimal ml-5 mt-2 space-y-1">
                  <li>Right-click on each image above</li>
                  <li>Select "Save image as..."</li>
                  <li>Save as the filenames shown above</li>
                  <li>Upload them back to replace the current logos</li>
                </ol>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default LogoProcessor;
