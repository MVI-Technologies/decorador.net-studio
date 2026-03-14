import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Settings, Save, Loader2, DollarSign, Percent } from "lucide-react";
import type { AdminPlatformSettings } from "@/types/api";

export default function ConfiguracoesPlataforma() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    professionalMonthlyFee: 21.90,
    platformFeePercentage: 15,
  });

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const { data } = await api.get<AdminPlatformSettings>("/admin/settings/platform");
      setForm({
        professionalMonthlyFee: data.professionalMonthlyFee || 21.90,
        platformFeePercentage: data.platformFeePercentage || 15,
      });
    } catch (error) {
      console.error("Erro ao carregar configs da plataforma", error);
      toast.error("Erro ao buscar configurações.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.patch("/admin/settings/platform", form);
      toast.success("Configurações atualizadas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar configs", error);
      toast.error("Erro ao atualizar as configurações. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-12 h-12 bg-primary/10 flex items-center justify-center rounded-xl border border-primary/20">
          <Settings className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Taxas e Mensalidades</h1>
          <p className="text-gray-400">Configure os valores gerais de cobrança do sistema</p>
        </div>
      </div>

      <div className="bg-[#1A1F2C] border border-[#2A2F3C] rounded-xl p-6 space-y-8">
        
        {/* Taxa Administrativa (%) */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="platformFee" className="text-base text-gray-200">Taxa Administrativa da Plataforma (%)</Label>
            <p className="text-sm text-gray-400 mb-2">
              Porcentagem descontada do valor pago pelo cliente (Checkout Mercado Pago) antes do repasse ao profissional.
            </p>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Percent className="h-5 w-5 text-gray-500" />
            </div>
            <Input
              id="platformFee"
              type="number"
              value={form.platformFeePercentage}
              onChange={(e) => handleChange("platformFeePercentage", e.target.value)}
              className="pl-10 bg-[#2A2F3C] border-[#3A3F4C] text-white"
              min="0"
              max="100"
              step="1"
            />
          </div>
        </div>

        <div className="h-px w-full bg-[#2A2F3C]"></div>

        {/* Mensalidade dos Profissionais */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="monthlyFee" className="text-base text-gray-200">Mensalidade dos Profissionais (R$)</Label>
            <p className="text-sm text-gray-400 mb-2">
              Valor recorrente cobrado dos decoradores para utilizarem a plataforma e receberem projetos.
            </p>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 font-medium">R$</span>
            </div>
            <Input
              id="monthlyFee"
              type="number"
              value={form.professionalMonthlyFee}
              onChange={(e) => handleChange("professionalMonthlyFee", e.target.value)}
              className="pl-10 bg-[#2A2F3C] border-[#3A3F4C] text-white"
              min="0"
              step="0.10"
            />
          </div>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={saving} 
          className="w-full mt-8"
          size="lg"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <Save className="w-5 h-5 mr-2" />
          )}
          Salvar Configurações
        </Button>

      </div>
    </div>
  );
}
