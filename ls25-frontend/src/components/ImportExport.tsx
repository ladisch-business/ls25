import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { importExportApi } from '@/lib/api';

export function ImportExport() {
  const [exportData, setExportData] = useState<string>('');
  const [importData, setImportData] = useState<string>('');
  const [mergeMode, setMergeMode] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await importExportApi.exportData();
      const jsonString = JSON.stringify(data, null, 2);
      setExportData(jsonString);
      
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ls25-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setMessage({ type: 'success', text: 'Daten erfolgreich exportiert und heruntergeladen!' });
    } catch (error) {
      console.error('Export error:', error);
      setMessage({ type: 'error', text: 'Fehler beim Exportieren der Daten.' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    if (!importData.trim()) {
      setMessage({ type: 'error', text: 'Bitte geben Sie JSON-Daten zum Importieren ein.' });
      return;
    }

    setIsImporting(true);
    try {
      const data = JSON.parse(importData);
      await importExportApi.importData(data, mergeMode);
      setMessage({ type: 'success', text: 'Daten erfolgreich importiert!' });
      setImportData('');
    } catch (error) {
      console.error('Import error:', error);
      if (error instanceof SyntaxError) {
        setMessage({ type: 'error', text: 'Ungültiges JSON-Format. Bitte überprüfen Sie die Eingabe.' });
      } else {
        setMessage({ type: 'error', text: 'Fehler beim Importieren der Daten.' });
      }
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setImportData(content);
      };
      reader.readAsText(file);
    }
  };

  const clearMessage = () => {
    setMessage(null);
  };

  return (
    <div className="space-y-6">
      {/* Message Alert */}
      {message && (
        <Alert className={message.type === 'success' ? 'border-green-500' : 'border-red-500'}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-500" />
          )}
          <AlertDescription className="flex justify-between items-center">
            {message.text}
            <Button variant="ghost" size="sm" onClick={clearMessage}>
              ×
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Daten Exportieren
          </CardTitle>
          <CardDescription>
            Exportieren Sie alle Waren, Produktionen und Gebäude als JSON-Datei
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={handleExport} 
              disabled={isExporting}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exportiere...' : 'Alle Daten exportieren'}
            </Button>
            
            {exportData && (
              <div>
                <Label htmlFor="export-preview">Export Vorschau:</Label>
                <Textarea
                  id="export-preview"
                  value={exportData}
                  readOnly
                  className="mt-2 h-32 font-mono text-sm"
                  placeholder="Exportierte Daten werden hier angezeigt..."
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Daten Importieren
          </CardTitle>
          <CardDescription>
            Importieren Sie Waren, Produktionen und Gebäude aus einer JSON-Datei
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* File Upload */}
            <div>
              <Label htmlFor="file-upload">JSON-Datei auswählen:</Label>
              <input
                id="file-upload"
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            {/* Manual JSON Input */}
            <div>
              <Label htmlFor="import-data">Oder JSON-Daten direkt eingeben:</Label>
              <Textarea
                id="import-data"
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                className="mt-2 h-40 font-mono text-sm"
                placeholder="JSON-Daten hier einfügen..."
              />
            </div>

            {/* Import Options */}
            <div className="flex items-center space-x-2">
              <Switch
                id="merge-mode"
                checked={mergeMode}
                onCheckedChange={setMergeMode}
              />
              <Label htmlFor="merge-mode">
                Merge-Modus (bestehende Daten beibehalten)
              </Label>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {mergeMode 
                  ? "Im Merge-Modus werden nur neue Daten hinzugefügt. Bestehende Daten bleiben erhalten."
                  : "Ohne Merge-Modus werden ALLE bestehenden Daten gelöscht und durch die importierten Daten ersetzt!"
                }
              </AlertDescription>
            </Alert>

            <Button 
              onClick={handleImport} 
              disabled={isImporting || !importData.trim()}
              className="w-full"
              variant={mergeMode ? "default" : "destructive"}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isImporting ? 'Importiere...' : (mergeMode ? 'Daten importieren (Merge)' : 'Daten importieren (Ersetzen)')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Documentation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            JSON-Format Dokumentation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>Export Format:</strong> Die exportierte JSON-Datei enthält drei Hauptbereiche:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><code>waren</code>: Array aller Waren mit ID, Name, Einheit, Dichte und Preis</li>
              <li><code>produktionen</code>: Array aller Produktionen mit Ein-/Ausgängen und Kosten</li>
              <li><code>gebaeude</code>: Array aller Gebäude mit zugeordneten Produktionen</li>
            </ul>
            <p><strong>Import:</strong> Sie können sowohl vollständige Exports als auch Teilbereiche importieren.</p>
            <p><strong>UUIDs:</strong> Eindeutige IDs werden automatisch generiert, wenn nicht vorhanden.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
