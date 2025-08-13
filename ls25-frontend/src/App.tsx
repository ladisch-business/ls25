import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { WarenManager } from '@/components/WarenManager'
import { ProduktionenManager } from '@/components/ProduktionenManager'
import { GebaeudeManager } from '@/components/GebaeudeManager'
import { TechTreeVisualization } from '@/components/TechTreeVisualization'
import { SzenarioRechner } from '@/components/SzenarioRechner'
import { ImportExport } from '@/components/ImportExport'
import { Factory, Package, Building, GitBranch, Calculator, Download } from 'lucide-react'

function App() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">LS25 Produktions-Helper</CardTitle>
            <CardDescription className="text-center">
              Planung und Bewertung von Produktionsketten in Landwirtschafts-Simulator 25
            </CardDescription>
          </CardHeader>
        </Card>

        <Tabs defaultValue="waren" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="waren" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Waren
            </TabsTrigger>
            <TabsTrigger value="produktionen" className="flex items-center gap-2">
              <Factory className="h-4 w-4" />
              Produktionen
            </TabsTrigger>
            <TabsTrigger value="gebaeude" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Gebäude
            </TabsTrigger>
            <TabsTrigger value="techtree" className="flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              TechTree
            </TabsTrigger>
            <TabsTrigger value="szenario" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Szenario-Rechner
            </TabsTrigger>
            <TabsTrigger value="import-export" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Import/Export
            </TabsTrigger>
          </TabsList>

          <TabsContent value="waren" className="mt-6">
            <WarenManager />
          </TabsContent>

          <TabsContent value="produktionen" className="mt-6">
            <ProduktionenManager />
          </TabsContent>

          <TabsContent value="gebaeude" className="mt-6">
            <GebaeudeManager />
          </TabsContent>

          <TabsContent value="techtree" className="mt-6">
            <TechTreeVisualization />
          </TabsContent>

          <TabsContent value="szenario" className="mt-6">
            <SzenarioRechner />
          </TabsContent>

          <TabsContent value="import-export" className="mt-6">
            <ImportExport />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default App
