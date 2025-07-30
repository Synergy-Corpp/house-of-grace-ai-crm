
import { supabase } from "@/integrations/supabase/client";

interface LogActivityParams {
  action: string;
  entityType: string;
  entityId?: string;
  entityName: string;
  userEmail: string;
  details?: any;
}

export const logActivity = async ({
  action,
  entityType,
  entityId,
  entityName,
  userEmail,
  details
}: LogActivityParams) => {
  try {
    console.log('Logging activity:', { action, entityType, entityId, entityName, userEmail, details });
    
    const { data, error } = await supabase
      .from('activity_logs')
      .insert({
        action,
        entity_type: entityType,
        entity_id: entityId,
        entity_name: entityName,
        user_email: userEmail,
        details: details ? JSON.stringify(details) : null
      })
      .select()
      .single();

    if (error) {
      console.error('Error logging activity:', error);
      throw error;
    }

    console.log('Activity logged successfully:', data);
    return data;
  } catch (error) {
    console.error('Error logging activity:', error);
    throw error;
  }
};
