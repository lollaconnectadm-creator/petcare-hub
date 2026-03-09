
-- Create hospedagem status enum
CREATE TYPE public.hospedagem_status AS ENUM ('reservado', 'hospedado', 'pronto_retirada', 'finalizado');

-- Create hospedagens table
CREATE TABLE public.hospedagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  tutor_id uuid NOT NULL REFERENCES public.tutores(id) ON DELETE CASCADE,
  data_entrada date NOT NULL,
  data_saida_prevista date NOT NULL,
  data_saida_real date,
  valor_diaria numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  status hospedagem_status NOT NULL DEFAULT 'reservado',
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hospedagens ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own hospedagens" ON public.hospedagens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own hospedagens" ON public.hospedagens FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own hospedagens" ON public.hospedagens FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own hospedagens" ON public.hospedagens FOR DELETE USING (auth.uid() = user_id);

-- Add hotel config columns to existing configuracoes if not there (total_vagas already handled by max_hotel)
