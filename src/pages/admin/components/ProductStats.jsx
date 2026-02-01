export default function ProductStats({ products }) {
  const total = products.length;

  const byCategory = products.reduce((acc, p) => {
    const cat = p.category || "others";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <Stat label="Total Products" value={total} />
      <Stat label="Shoes" value={byCategory.shoes || 0} />
      <Stat label="Footwears" value={byCategory.footwears || 0} />
      <Stat label="Heels" value={byCategory.heels || 0} />
      <Stat label="Jewelry" value={byCategory.jewelry || 0} />
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-white border rounded-xl p-4">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
