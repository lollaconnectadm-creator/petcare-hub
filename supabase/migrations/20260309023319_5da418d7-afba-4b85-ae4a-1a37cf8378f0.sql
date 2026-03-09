
-- Create enum for financial type
CREATE TYPE public.financeiro_tipo AS ENUM ('receita', 'despesa');

-- Create financeiro table
CREATE TABLE public.financeiro (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tipo public.financeiro_tipo NOT NULL,
  categoria TEXT NOT NULL,
  descricao TEXT NOT NULL,
  valor NUMERIC(10,2) NOT NULL DEFAULT 0,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  tutor_id UUID REFERENCES public.tutores(id) ON DELETE SET NULL,
  pet_id UUID REFERENCES public.pets(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.financeiro ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own financeiro" ON public.financeiro FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own financeiro" ON public.financeiro FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own financeiro" ON public.financeiro FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own financeiro" ON public.financeiro FOR DELETE USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER update_financeiro_updated_at BEFORE UPDATE ON public.financeiro FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
