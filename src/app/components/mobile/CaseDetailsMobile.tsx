import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ChevronLeft,
  Download,
  Upload,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Share2,
} from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

export function CaseDetailsMobile() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);

  const caseData = {
    id: caseId,
    number: "0001234-56.2024.8.26.0100",
    status: "Em Andamento",
    statusColor: "bg-blue-500",
    client: "João da Silva",
    tribunal: "TJSP - 1ª Vara Cível",
    parts: {
      autor: "João da Silva",
      reu: "Empresa ABC Ltda",
    },
    distribuicao: "10/01/2024",
    valor: "R$ 50.000,00",
  };

  const timeline = [
    {
      id: 1,
      date: "15/04/2026",
      type: "audiencia",
      title: "Audiência de Conciliação Marcada",
      description: "Audiência agendada para 15/05/2026 às 14:00",
      icon: Calendar,
      status: "pending",
    },
    {
      id: 2,
      date: "10/04/2026",
      type: "movimentacao",
      title: "Juntada de Documentos",
      description: "Petição com documentos complementares protocolada",
      icon: FileText,
      status: "completed",
    },
    {
      id: 3,
      date: "05/04/2026",
      type: "prazo",
      title: "Prazo para Contestação",
      description: "Réu apresentou contestação dentro do prazo",
      icon: Clock,
      status: "completed",
    },
    {
      id: 4,
      date: "28/03/2026",
      type: "movimentacao",
      title: "Citação Realizada",
      description: "Réu citado via oficial de justiça",
      icon: CheckCircle,
      status: "completed",
    },
    {
      id: 5,
      date: "15/03/2026",
      type: "movimentacao",
      title: "Despacho Inicial",
      description: "Processo recebido e autuado",
      icon: FileText,
      status: "completed",
    },
    {
      id: 6,
      date: "10/01/2024",
      type: "inicio",
      title: "Distribuição do Processo",
      description: "Processo distribuído à 1ª Vara Cível",
      icon: FileText,
      status: "completed",
    },
  ];

  const handleExportPDF = () => {
    // Mock PDF export
    alert("Exportando processo em PDF...");
  };

  const handleFileUpload = () => {
    setUploading(true);
    // Mock file upload
    setTimeout(() => {
      setUploading(false);
      alert("Arquivo de autorização enviado com sucesso!");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-[#1A2B3C] text-white px-4 pt-4 pb-6 sticky top-14 z-20 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Detalhes do Processo</h1>
          </div>
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        {/* Case Number */}
        <p className="font-mono text-sm text-slate-200 mb-2">{caseData.number}</p>
        
        <Badge className={`${caseData.statusColor} text-white border-0 text-xs mb-3`}>
          {caseData.status}
        </Badge>
      </div>

      {/* Case Info */}
      <div className="px-4 py-4 bg-white border-b border-slate-200">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-500 mb-1">Cliente</p>
            <p className="text-sm font-semibold text-[#1A2B3C]">{caseData.client}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Tribunal</p>
            <p className="text-sm font-semibold text-[#1A2B3C]">TJSP</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Distribuição</p>
            <p className="text-sm font-semibold text-[#1A2B3C]">{caseData.distribuicao}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Valor da Causa</p>
            <p className="text-sm font-semibold text-[#1A2B3C]">{caseData.valor}</p>
          </div>
        </div>

        {/* Parties */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="mb-3">
            <p className="text-xs text-slate-500 mb-1">Autor</p>
            <p className="text-sm text-slate-900">{caseData.parts.autor}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Réu</p>
            <p className="text-sm text-slate-900">{caseData.parts.reu}</p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="px-4 py-6">
        <h2 className="text-lg font-semibold text-[#1A2B3C] mb-4">
          Linha do Tempo
        </h2>

        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-slate-200"></div>

          <div className="space-y-6">
            {timeline.map((item, index) => {
              const Icon = item.icon;
              const isPending = item.status === "pending";
              
              return (
                <div key={item.id} className="relative pl-12">
                  {/* Timeline Icon */}
                  <div
                    className={`absolute left-0 w-10 h-10 rounded-full flex items-center justify-center z-10 ${
                      isPending
                        ? "bg-yellow-100 border-2 border-yellow-500"
                        : "bg-green-100 border-2 border-green-500"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        isPending ? "text-yellow-600" : "text-green-600"
                      }`}
                    />
                  </div>

                  {/* Timeline Content */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-xs text-slate-500">{item.date}</p>
                      {isPending && (
                        <Badge className="bg-yellow-500 text-white border-0 text-xs">
                          Pendente
                        </Badge>
                      )}
                    </div>
                    
                    <h3 className="font-semibold text-sm text-[#1A2B3C] mb-2">
                      {item.title}
                    </h3>
                    
                    <p className="text-sm text-slate-600">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Compliance Upload Section */}
      <div className="px-4 pb-6">
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl border border-slate-200 p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Upload className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm text-[#1A2B3C] mb-1">
                Autorização de Compliance
              </h3>
              <p className="text-xs text-slate-600">
                Faça upload dos documentos de autorização necessários
              </p>
            </div>
          </div>
          
          <Button
            onClick={handleFileUpload}
            disabled={uploading}
            className="w-full bg-[#1A2B3C] hover:bg-[#1A2B3C]/90 text-white rounded-xl"
          >
            {uploading ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Fazer Upload
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Floating Action Button - Export PDF */}
      <button
        onClick={handleExportPDF}
        className="fixed bottom-20 right-4 bg-[#C5A059] hover:bg-[#C5A059]/90 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110 z-20"
      >
        <Download className="w-6 h-6" />
      </button>
    </div>
  );
}