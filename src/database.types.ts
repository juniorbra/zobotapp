export interface Database {
  public: {
    Tables: {
      qa_pairs: {
        Row: {
          id: string;
          question: string;
          answer: string;
          agent_id: string;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          question: string;
          answer: string;
          agent_id: string;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          question?: string;
          answer?: string;
          agent_id?: string;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      agents: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description?: string;
          active: boolean;
          type: string;
          prompt?: string;
          model: string;
          webhook_url?: string;
          response_template?: string;
          advanced_settings?: {
            temperature: number;
            max_tokens: number;
          };
          stop_bot_on_message?: boolean;
          pause_window_minutes?: number;
          split_long_messages?: boolean;
          show_typing_indicator?: boolean;
          typing_delay_per_char_ms?: number;
          concat_messages?: boolean;
          concat_time_seconds?: number;
          context_window_size?: number;
          followup?: boolean;
          google_calendar_access_mode?: string;
          google_calendar_start_time?: string;
          google_calendar_end_time?: string;
          google_calendar_allowed_days?: string[];
          google_calendar_default_duration?: number;
          google_calendar_add_client_as_guest?: boolean;
          google_calendar_auto_reschedule?: boolean;
          google_calendar_auto_delete?: boolean;
          google_calendar_custom_instructions?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string;
          active?: boolean;
          type?: string;
          prompt?: string;
          model?: string;
          webhook_url?: string;
          response_template?: string;
          advanced_settings?: {
            temperature: number;
            max_tokens: number;
          };
          stop_bot_on_message?: boolean;
          pause_window_minutes?: number;
          split_long_messages?: boolean;
          show_typing_indicator?: boolean;
          typing_delay_per_char_ms?: number;
          concat_messages?: boolean;
          concat_time_seconds?: number;
          context_window_size?: number;
          followup?: boolean;
          google_calendar_access_mode?: string;
          google_calendar_start_time?: string;
          google_calendar_end_time?: string;
          google_calendar_allowed_days?: string[];
          google_calendar_default_duration?: number;
          google_calendar_add_client_as_guest?: boolean;
          google_calendar_auto_reschedule?: boolean;
          google_calendar_auto_delete?: boolean;
          google_calendar_custom_instructions?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string;
          active?: boolean;
          type?: string;
          prompt?: string;
          model?: string;
          webhook_url?: string;
          response_template?: string;
          advanced_settings?: {
            temperature: number;
            max_tokens: number;
          };
          stop_bot_on_message?: boolean;
          pause_window_minutes?: number;
          split_long_messages?: boolean;
          show_typing_indicator?: boolean;
          typing_delay_per_char_ms?: number;
          concat_messages?: boolean;
          concat_time_seconds?: number;
          context_window_size?: number;
          followup?: boolean;
          google_calendar_access_mode?: string;
          google_calendar_start_time?: string;
          google_calendar_end_time?: string;
          google_calendar_allowed_days?: string[];
          google_calendar_default_duration?: number;
          google_calendar_add_client_as_guest?: boolean;
          google_calendar_auto_reschedule?: boolean;
          google_calendar_auto_delete?: boolean;
          google_calendar_custom_instructions?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
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
          google_calendar_connected?: boolean;
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
          google_calendar_connected?: boolean;
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
          google_calendar_connected?: boolean;
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
