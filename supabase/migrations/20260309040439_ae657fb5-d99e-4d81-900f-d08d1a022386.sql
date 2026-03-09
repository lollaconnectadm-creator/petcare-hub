
CREATE TABLE public.categorias_financeiro (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.categorias_financeiro ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own categorias_financeiro"
  ON public.categorias_financeiro FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own categorias_financeiro"
  ON public.categorias_financeiro FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categorias_financeiro"
  ON public.categorias_financeiro FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categorias_financeiro"
  ON public.categorias_financeiro FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_categorias_financeiro_updated_at
  BEFORE UPDATE ON public.categorias_financeiro
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
