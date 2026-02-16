import { useEffect, useState } from 'react';
import { ResponsiveContainer, Sankey, Tooltip } from 'recharts';
import { ArrowLeftRight } from 'lucide-react';
import { financeApi } from '../../api';
import { EmptyState } from '../ui/EmptyState';

interface CashFlowData {
  nodes: { name: string }[];
  links: { source: number; target: number; value: number }[];
}

export function CashFlowSankey() {
  const [data, setData] = useState<CashFlowData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await financeApi.getCashFlow({ days: 60 });
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="h-72 bg-bg-subtle rounded-lg animate-pulse" />
    );
  }

  if (!data || data.nodes.length === 0) {
    return (
      <EmptyState
        icon={<ArrowLeftRight className="w-8 h-8" />}
        title="No cash flow data"
        description="Add transactions to see your money flow visualization."
      />
    );
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <Sankey
          data={data}
          nodeWidth={15}
          nodePadding={30}
          margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
          link={{ stroke: '#8884d8', strokeOpacity: 0.3 }}
          node={{ fill: '#3B82F6', stroke: '#2563EB' }}
        >
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--bg-elevated))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius)',
            }}
          />
        </Sankey>
      </ResponsiveContainer>
    </div>
  );
}
