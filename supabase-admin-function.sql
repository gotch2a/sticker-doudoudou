-- Fonction SQL à exécuter dans Supabase SQL Editor
-- Cette fonction permet de mettre à jour le statut des commandes avec des privilèges admin

CREATE OR REPLACE FUNCTION update_order_status_admin(
  order_id UUID,
  new_status TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- Important: s'exécute avec les privilèges du propriétaire
AS $$
DECLARE
  updated_order JSON;
BEGIN
  -- Vérifier que le statut est valide
  IF new_status NOT IN ('nouveau', 'en_cours', 'termine', 'expedie', 'livre') THEN
    RAISE EXCEPTION 'Statut invalide: %', new_status;
  END IF;

  -- Mettre à jour la commande (bypass RLS avec SECURITY DEFINER)
  UPDATE orders 
  SET 
    status = new_status,
    updated_at = NOW()
  WHERE id = order_id
  RETURNING row_to_json(orders.*) INTO updated_order;

  -- Vérifier qu'une ligne a été mise à jour
  IF updated_order IS NULL THEN
    RAISE EXCEPTION 'Commande non trouvée: %', order_id;
  END IF;

  RETURN updated_order;
END;
$$;

-- Donner les permissions d'exécution à tous les utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION update_order_status_admin(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_order_status_admin(UUID, TEXT) TO anon;
