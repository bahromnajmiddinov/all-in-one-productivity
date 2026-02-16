import { useEffect, useState } from 'react';
import { ResponsiveContainer, Sankey, Tooltip } from 'recharts';
import { financeApi } from '../../api';

interface CashFlowData {
  nodes: { name: string }[];
  links: { source: number; target: number; value: number }[];
}

export function CashFlowSankey() {
  const [data, setData] = useState<CashFlowData | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await financeApi.getCashFlow({ days: 60 });
        setData(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  if (!data || data.nodes.length === 0) {
    return <div className="text-sm text-muted-foreground">No cash flow data yet.</div>;
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <Sankey
          data={data}
          nodeWidth={15}
          nodePadding={30}
          margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Tooltip />
        </Sankey>
      </ResponsiveContainer>
    </div>
  );
}
