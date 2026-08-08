interface ProfessionalInfoCardProps {
  fullLegalName: string;
  employeeId: string;
  primaryEmail: string;
  phoneNumber: string;
}

export function ProfessionalInfoCard({
  fullLegalName,
  employeeId,
  primaryEmail,
  phoneNumber,
}: ProfessionalInfoCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-['Lexend'] font-semibold text-[#043658] text-sm">
          Professional Information
        </h3>
        <button className="text-xs font-medium text-[#043658] hover:underline">Update Info</button>
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
        <div>
          <p className="text-xs text-slate-400">Full Legal Name</p>
          <p className="text-sm font-medium text-[#043658] mt-0.5">{fullLegalName}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Employee ID</p>
          <p className="text-sm font-medium text-[#043658] mt-0.5">{employeeId}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Primary Email</p>
          <p className="text-sm font-medium text-[#043658] mt-0.5">{primaryEmail}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Phone Number</p>
          <p className="text-sm font-medium text-[#043658] mt-0.5">{phoneNumber}</p>
        </div>
      </div>
    </div>
  );
}
