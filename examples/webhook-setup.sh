# Example: Receiving a GoHighLevel webhook

# GHL webhooks POST JSON to your capture URL. The toolkit's
# /api/webhooks/capture/[slug] endpoint accepts any JSON body
# and stores it for inspection in the Webhook Inspector module.
#
# To test from your terminal:
#
#   curl -X POST https://your-host/api/webhooks/capture/test \
#     -H "Content-Type: application/json" \
#     -d '{
#       "type": "LeadCreated",
#       "locationId": "your_location_id",
#       "contactId": "contact_abc123",
#       "firstName": "Jane",
#       "lastName": "Cooper",
#       "email": "jane.cooper@example.com",
#       "phone": "+15555550123",
#       "source": "Website Form"
#     }'
#
# Then open the Webhook Inspector in the dashboard — the event
# will appear in the list with full headers and parsed payload.
#
# In GHL Marketplace > OAuth > Webhooks, configure:
#   - Webhook URL: https://your-host/api/webhooks/capture/<your-slug>
#   - Subscribe to event types: LeadCreated, ContactUpdated, AppointmentCreated, etc.
#   - Make sure your OAuth scopes include the write scope for each entity.

echo "See the comments in this file for webhook setup instructions."
