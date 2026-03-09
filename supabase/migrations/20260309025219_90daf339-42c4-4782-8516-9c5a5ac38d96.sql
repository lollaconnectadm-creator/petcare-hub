
-- Create funcao enum
CREATE TYPE public.funcao_tipo AS ENUM ('banhista', 'tosador', 'recepcao', 'veterinario', 'auxiliar');

-- Create funcionarios table
CREATE TABLE public.funcionarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  funcao public.funcao_tipo NOT NULL,
  telefone TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own funcionarios" ON public.funcionarios FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own funcionarios" ON public.funcionarios FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own funcionarios" ON public.funcionarios FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own funcionarios" ON public.funcionarios FOR DELETE USING (auth.uid() = user_id);

-- Create servicos table
CREATE TABLE public.servicos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  duracao_media INTEGER NOT NULL DEFAULT 30,
  preco_base NUMERIC NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own servicos" ON public.servicos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own servicos" ON public.servicos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own servicos" ON public.servicos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own servicos" ON public.servicos FOR DELETE USING (auth.uid() = user_id);

-- Create agenda_funcionario junction table
CREATE TABLE public.agenda_funcionario (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  funcionario_id UUID NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
  agendamento_id UUID NOT NULL REFERENCES public.agendamentos(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(funcionario_id, agendamento_id)
);

ALTER TABLE public.agenda_funcionario ENABLE ROW LEVEL SECURITY;

-- For agenda_funcionario, we check via the agendamento's user_id
CREATE POLICY "Users can view their own agenda_funcionario" ON public.agenda_funcionario FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.agendamentos WHERE agendamentos.id = agenda_funcionario.agendamento_id AND agendamentos.user_id = auth.uid())
);
CREATE POLICY "Users can create their own agenda_funcionario" ON public.agenda_funcionario FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.agendamentos WHERE agendamentos.id = agenda_funcionario.agendamento_id AND agendamentos.user_id = auth.uid())
);
CREATE POLICY "Users can delete their own agenda_funcionario" ON public.agenda_funcionario FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.agendamentos WHERE agendamentos.id = agenda_funcionario.agendamento_id AND agendamentos.user_id = auth.uid())
);

-- Add funcionario_id to agendamentos for quick reference
ALTER TABLE public.agendamentos ADD COLUMN funcionario_id UUID REFERENCES public.funcionarios(id);

-- Create capacidade_operacional config table
CREATE TABLE public.configuracoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  banhos_por_hora INTEGER NOT NULL DEFAULT 3,
  max_hotel INTEGER NOT NULL DEFAULT 20,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own configuracoes" ON public.configuracoes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own configuracoes" ON public.configuracoes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own configuracoes" ON public.configuracoes FOR UPDATE USING (auth.uid() = user_id);
