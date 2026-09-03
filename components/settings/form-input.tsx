export default function FormInput({
  label,
  value,
  type = "text",
  disabled = false,
}: {
  label: string;
  value: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <label className="text-sm font-medium text-[#31534f] dark:text-[#c4dfd5]">
      {label}
      <input
        className="mt-2 h-11 w-full rounded-xl border border-[#dbe9e4] bg-[#fbfdfc] px-3 text-sm text-[#173e3b] outline-none focus:border-[#55b99c] focus:ring-4 focus:ring-[#dff6ec] disabled:bg-[#f3f7f5] disabled:text-[#718783] dark:border-[#1d4941] dark:bg-[#102f2d] dark:text-[#e8f7f1] dark:focus:ring-[#1d5a4b] dark:disabled:bg-[#173a35] dark:disabled:text-[#91b0a6]"
        defaultValue={value}
        disabled={disabled}
        type={type}
      />
    </label>
  );
}
