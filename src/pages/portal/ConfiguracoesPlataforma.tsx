import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Settings, Save, Loader2, DollarSign, Percent, Info, CreditCard } from "lucide-react";
import type { AdminPlatformSettings } from "@/types/api";

const MP_INSTALLMENT_RATES = [
  { p: 1, rate: "4,98%" }, { p: 2, rate: "9,28%" }, { p: 3, rate: "10,71%" },
  { p: 4, rate: "12,12%" }, { p: 5, rate: "13,38%" }, { p: 6, rate: "14,64%" },
  { p: 7, rate: "16,33%" }, { p: 8, rate: "17,21%" }, { p: 9, rate: "18,32%" },
  { p: 10, rate: "19,17%" }, { p: 11, rate: "20,29%" }, { p: 12, rate: "21,32%" },
];

export default function ConfiguracoesPlataforma() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    professionalMonthlyFee: 1.00,
    platformFeePercentage: 15,
    maxInstallments: 12,
  });

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const { data } = await api.get<AdminPlatformSettings>("/admin/settings/platform");
      setForm({
        professionalMonthlyFee: data.professionalMonthlyFee || 1.00,
        platformFeePercentage: data.platformFeePercentage || 15,
        maxInstallments: data.maxInstallments || 12,
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

        <div className="h-px w-full bg-[#2A2F3C]"></div>

        {/* Calculadora de Parcelamento Sem Juros */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="maxInstallments" className="text-base text-gray-200">
              Parcelas "Sem Juros" que você vai oferecer no Mercado Pago
            </Label>
            <p className="text-sm text-gray-400 mb-2">
              <strong>Isso é uma simulação de caixa:</strong> Digite quantas parcelas sem juros você cadastrou lá nas configurações da sua conta do Mercado Pago (Custos). O cliente sempre poderá parcelar em até 12x, mas os juros das parcelas acima deste valor serão cobrados dele.
            </p>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CreditCard className="h-5 w-5 text-gray-500" />
            </div>
            <Input
              id="maxInstallments"
              type="number"
              value={form.maxInstallments}
              onChange={(e) => handleChange("maxInstallments", e.target.value)}
              className="pl-10 bg-[#2A2F3C] border-[#3A3F4C] text-white"
              min="1"
              max="12"
              step="1"
            />
          </div>
          
          {/* Calculadora visual do lucro/prejuízo */}
          {(() => {
             const selectedRateStr = MP_INSTALLMENT_RATES.find(r => r.p === form.maxInstallments)?.rate || "4,98%";
             const mpRate = parseFloat(selectedRateStr.replace("%", "").replace(",", "."));
             const adminRate = form.platformFeePercentage || 0;
             const isLoss = mpRate > adminRate;
             const profit = adminRate - mpRate;
             
             return (
               <div className={`mt-3 rounded-lg border p-4 text-sm ${isLoss ? 'bg-red-950/30 border-red-900 text-red-300' : 'bg-green-950/30 border-green-900/50 text-green-300'}`}>
                 <p className="font-semibold mb-1 flex items-center gap-2">
                   {isLoss ? <Info className="h-4 w-4" /> : null}
                   Projeção de Lucro da Plataforma
                 </p>
                 <ul className="space-y-1 ml-4 list-disc opacity-90">
                   <li>Sua taxa administrativa: <strong>{adminRate}%</strong></li>
                   <li>Tarifa do Mercado Pago ({form.maxInstallments}x sem juros): <strong>- {selectedRateStr}</strong></li>
                   <li className={`pt-1 mt-1 font-bold border-t ${isLoss ? 'border-red-900/50' : 'border-green-900/50'}`}>
                     {isLoss ? 'Você terá de absorver (PREJUÍZO): ' : 'Lucro líquido que sobra para a plataforma: '}
                     {profit.toFixed(2).replace(".", ",")}%
                   </li>
                 </ul>
                 {isLoss && (
                   <p className="mt-2 text-xs opacity-80">
                     Atenção: A taxa administrativa cobrada do profissional é menor que a tarifa do Mercado Pago para esta quantidade de parcelas.
                   </p>
                 )}
               </div>
             );
          })()}
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

      <div className="bg-[#1A1F2C] border border-[#2A2F3C] rounded-xl p-6 mt-8">
        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-400" />
          Como funcionam os Juros e Taxas (Mercado Pago)?
        </h2>
        <div className="text-sm text-gray-300 space-y-3 mb-6">
          <p>
            Trabalhar com parcelamento requer estratégia! Por padrão, nossa recomendação é configurar sua conta do Mercado Pago para que <strong>o COMPRADOR assuma os juros integralmente</strong> (ele parcela e assume 100% do Custo Meli+). Desta forma, você absorve apenas a tarifa da primeira parcela (~4,98%) e não perde sua comissão (Taxa Administrativa).
          </p>
          <p>
            <strong>Vai oferecer "Sem Juros"? ATENÇÃO:</strong> Ao ir nas configurações da sua conta do Mercado Pago e ativar "Oferecer parcelamento sem juros", o Mercado Pago deduzirá violentamente a tarifa do <strong>seu lucro</strong> da tabela abaixo. Por isso desenhamos o painel interativo logo acima para que você saiba calcular matematicamente qual deve ser sua Taxa Administrativa caso tome essa atitude.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {MP_INSTALLMENT_RATES.map((rate) => (
            <div key={rate.p} className="bg-[#2A2F3C] rounded-lg p-3 text-center border border-[#3A3F4C]">
              <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">{rate.p}x</div>
              <div className="text-white font-bold">{rate.rate}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
