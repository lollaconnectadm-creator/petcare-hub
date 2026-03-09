-- Create tutores table
CREATE TABLE public.tutores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for tutores
ALTER TABLE public.tutores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tutores" 
ON public.tutores FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tutores" 
ON public.tutores FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tutores" 
ON public.tutores FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tutores" 
ON public.tutores FOR DELETE 
USING (auth.uid() = user_id);

-- Create pets table
CREATE TABLE public.pets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES public.tutores(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  raca TEXT,
  idade TEXT,
  porte TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for pets
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own pets" 
ON public.pets FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pets" 
ON public.pets FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pets" 
ON public.pets FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pets" 
ON public.pets FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for updated_at
CREATE TRIGGER update_tutores_updated_at
BEFORE UPDATE ON public.tutores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pets_updated_at
BEFORE UPDATE ON public.pets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();