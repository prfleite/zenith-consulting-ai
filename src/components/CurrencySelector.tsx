import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SUPPORTED_CURRENCIES, type CurrencyCode } from "@/lib/currencyUtils";

interface CurrencySelectorProps {
  value: CurrencyCode;
  onChange: (currency: CurrencyCode) => void;
  className?: string;
}

export const CurrencySelector = ({ value, onChange, className }: CurrencySelectorProps) => (
  <Select value={value} onValueChange={(v) => onChange(v as CurrencyCode)}>
    <SelectTrigger className={className || "w-[120px]"}>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {SUPPORTED_CURRENCIES.map((c) => (
        <SelectItem key={c.code} value={c.code}>
          {c.symbol} {c.code}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);
