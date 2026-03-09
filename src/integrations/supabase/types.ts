export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      agenda_funcionario: {
        Row: {
          agendamento_id: string
          created_at: string
          funcionario_id: string
          id: string
        }
        Insert: {
          agendamento_id: string
          created_at?: string
          funcionario_id: string
          id?: string
        }
        Update: {
          agendamento_id?: string
          created_at?: string
          funcionario_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agenda_funcionario_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: false
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_funcionario_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      agendamentos: {
        Row: {
          created_at: string
          data: string
          funcionario_id: string | null
          horario: string
          id: string
          observacoes: string | null
          pet_id: string
          servico: Database["public"]["Enums"]["servico_tipo"]
          status: Database["public"]["Enums"]["agendamento_status"]
          tutor_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data: string
          funcionario_id?: string | null
          horario: string
          id?: string
          observacoes?: string | null
          pet_id: string
          servico: Database["public"]["Enums"]["servico_tipo"]
          status?: Database["public"]["Enums"]["agendamento_status"]
          tutor_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: string
          funcionario_id?: string | null
          horario?: string
          id?: string
          observacoes?: string | null
          pet_id?: string
          servico?: Database["public"]["Enums"]["servico_tipo"]
          status?: Database["public"]["Enums"]["agendamento_status"]
          tutor_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "tutores"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes: {
        Row: {
          banhos_por_hora: number
          created_at: string
          id: string
          max_hotel: number
          updated_at: string
          user_id: string
        }
        Insert: {
          banhos_por_hora?: number
          created_at?: string
          id?: string
          max_hotel?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          banhos_por_hora?: number
          created_at?: string
          id?: string
          max_hotel?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      financeiro: {
        Row: {
          categoria: string
          created_at: string
          data: string
          descricao: string
          id: string
          pet_id: string | null
          tipo: Database["public"]["Enums"]["financeiro_tipo"]
          tutor_id: string | null
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          categoria: string
          created_at?: string
          data?: string
          descricao: string
          id?: string
          pet_id?: string | null
          tipo: Database["public"]["Enums"]["financeiro_tipo"]
          tutor_id?: string | null
          updated_at?: string
          user_id: string
          valor?: number
        }
        Update: {
          categoria?: string
          created_at?: string
          data?: string
          descricao?: string
          id?: string
          pet_id?: string | null
          tipo?: Database["public"]["Enums"]["financeiro_tipo"]
          tutor_id?: string | null
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "financeiro_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financeiro_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "tutores"
            referencedColumns: ["id"]
          },
        ]
      }
      funcionarios: {
        Row: {
          ativo: boolean
          created_at: string
          funcao: Database["public"]["Enums"]["funcao_tipo"]
          id: string
          nome: string
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          funcao: Database["public"]["Enums"]["funcao_tipo"]
          id?: string
          nome: string
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          funcao?: Database["public"]["Enums"]["funcao_tipo"]
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pets: {
        Row: {
          created_at: string
          id: string
          idade: string | null
          nome: string
          observacoes: string | null
          porte: string | null
          raca: string | null
          tutor_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          idade?: string | null
          nome: string
          observacoes?: string | null
          porte?: string | null
          raca?: string | null
          tutor_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          idade?: string | null
          nome?: string
          observacoes?: string | null
          porte?: string | null
          raca?: string | null
          tutor_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pets_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "tutores"
            referencedColumns: ["id"]
          },
        ]
      }
      servicos: {
        Row: {
          ativo: boolean
          created_at: string
          duracao_media: number
          id: string
          nome: string
          preco_base: number
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          duracao_media?: number
          id?: string
          nome: string
          preco_base?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          duracao_media?: number
          id?: string
          nome?: string
          preco_base?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tutores: {
        Row: {
          created_at: string
          email: string | null
          endereco: string | null
          id: string
          nome: string
          observacoes: string | null
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      agendamento_status:
        | "solicitado"
        | "confirmado"
        | "concluido"
        | "cancelado"
      financeiro_tipo: "receita" | "despesa"
      funcao_tipo:
        | "banhista"
        | "tosador"
        | "recepcao"
        | "veterinario"
        | "auxiliar"
      servico_tipo: "banho" | "tosa" | "banho_tosa"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      agendamento_status: [
        "solicitado",
        "confirmado",
        "concluido",
        "cancelado",
      ],
      financeiro_tipo: ["receita", "despesa"],
      funcao_tipo: [
        "banhista",
        "tosador",
        "recepcao",
        "veterinario",
        "auxiliar",
      ],
      servico_tipo: ["banho", "tosa", "banho_tosa"],
    },
  },
} as const
