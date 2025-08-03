# Test API Service Change
export const testContactsApi = async (contactId: string) => {
  // New API endpoint for contact analytics
  const response = await supabase
    .from('contacts')
    .select('*, interactions(*)')
    .eq('id', contactId)
    .single();
  return response;
};
