import { useNavigate } from "react-router-dom";
import { FileText, ArrowLeft } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/common/EmptyState";
import { Button } from "../../components/ui/button";

export default function ContractDetailsPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/contracts")}
          className="text-xs text-muted-foreground hover:text-foreground gap-1.5 pl-0"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Contracts
        </Button>
      </div>

      <PageHeader
        title="Contract Details"
        subtitle="Detailed contract terms, wage structures, and historical timeline."
      />

      <div className="py-8">
        <EmptyState
          icon={FileText}
          title="Contract Details — Coming in next step"
          description="Detailed contract management, wage breakdowns, approval workflow, and renewal history will be available in Step 3.2."
          actionLabel="Back to Contracts"
          onAction={() => navigate("/contracts")}
        />
      </div>
    </div>
  );
}
