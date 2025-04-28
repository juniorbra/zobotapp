export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nome?: string;
          telefone?: string;
          email: string;
          whatsapp?: string;
          assinatura?: boolean;
          consumo?: number;
          franquia?: number;
          prompt?: string;
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          id: string;
          nome?: string;
          telefone?: string;
          email: string;
          whatsapp?: string;
          assinatura?: boolean;
          consumo?: number;
          franquia?: number;
          prompt?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          telefone?: string;
          email?: string;
          whatsapp?: string;
          assinatura?: boolean;
          consumo?: number;
          franquia?: number;
          prompt?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Functions: {
      execute_sql: {
        Args: {
          sql_query: string;
        };
        Returns: void;
      };
      get_profile: {
        Args: Record<string, never>;
        Returns: Database["public"]["Tables"]["profiles"]["Row"][];
      };
    };
  };
}
