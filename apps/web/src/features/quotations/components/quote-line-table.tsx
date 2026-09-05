import { useFieldArray, Control, UseFormRegister } from "react-hook-form";
import { Product, QuoteLineInput } from "../types";
import { Plus, Trash2 } from "lucide-react";

interface QuoteLineTableProps {
  control: Control<{ lines: QuoteLineInput[] }>;
  register: UseFormRegister<{ lines: QuoteLineInput[] }>;
  products: Product[];
}

export function QuoteLineTable({ control, register, products }: QuoteLineTableProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "lines",
  });

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-foreground">Quote Lines</h3>
        <button
          type="button"
          onClick={() => append({ product_id: "", quantity: 1, discount_percent: 0 })}
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-primary hover:text-primary/80"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Line
        </button>
      </div>

      <div className="rounded-md border border-border bg-surface overflow-hidden">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-muted text-foreground-muted border-b border-border">
            <tr>
              <th className="px-3 py-2 font-medium w-1/2">Product</th>
              <th className="px-3 py-2 font-medium w-24">Qty</th>
              <th className="px-3 py-2 font-medium w-32">Discount (%)</th>
              <th className="px-3 py-2 font-medium w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {fields.map((field, index) => (
              <tr key={field.id} className="hover:bg-muted/30">
                <td className="px-3 py-1.5">
                  <select
                    {...register(`lines.${index}.product_id`)}
                    className="w-full h-8 bg-transparent border border-transparent hover:border-input focus:border-primary focus:ring-1 focus:ring-primary rounded px-1 transition-colors outline-none"
                  >
                    <option value="" disabled>Select a product...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (${p.sales_price.toLocaleString()})</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-1.5">
                  <input
                    type="number"
                    min="1"
                    {...register(`lines.${index}.quantity`, { valueAsNumber: true })}
                    className="w-full h-8 bg-transparent border border-transparent hover:border-input focus:border-primary focus:ring-1 focus:ring-primary rounded px-2 transition-colors outline-none"
                  />
                </td>
                <td className="px-3 py-1.5">
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      {...register(`lines.${index}.discount_percent`, { valueAsNumber: true })}
                      className="w-full h-8 bg-transparent border border-transparent hover:border-input focus:border-primary focus:ring-1 focus:ring-primary rounded px-2 transition-colors outline-none pr-5"
                    />
                    <span className="absolute right-2 text-foreground-muted text-[11px] pointer-events-none">%</span>
                  </div>
                </td>
                <td className="px-3 py-1.5 text-right">
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="p-1.5 text-foreground-muted hover:text-danger hover:bg-danger/10 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {fields.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-foreground-muted">
                  No lines added yet. Click "Add Line" to start quoting.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
