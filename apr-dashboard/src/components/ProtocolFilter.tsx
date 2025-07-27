import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ProtocolFilterProps {
  protocols: string[]
  selectedProtocols: string[]
  onProtocolToggle: (protocol: string) => void
  onSelectAll: () => void
  onClearAll: () => void
}

export function ProtocolFilter({ 
  protocols, 
  selectedProtocols, 
  onProtocolToggle, 
  onSelectAll, 
  onClearAll 
}: ProtocolFilterProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Filter by Protocol</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onSelectAll}
            className="text-xs"
          >
            Select All
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClearAll}
            className="text-xs"
          >
            Clear All
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {protocols.map((protocol) => (
            <Button
              key={protocol}
              variant={selectedProtocols.includes(protocol) ? "default" : "outline"}
              size="sm"
              onClick={() => onProtocolToggle(protocol)}
              className="text-xs"
            >
              {protocol}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
