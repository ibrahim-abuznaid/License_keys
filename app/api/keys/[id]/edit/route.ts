import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { KEY_HISTORY_TABLE, LICENSE_KEYS_TABLE } from '@/lib/config';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const keyValue = params.id;

    // Extract all possible fields from body
    const updateData: any = {};
    
    // Basic fields
    if (body.email !== undefined) updateData.email = body.email;
    if (body.keyType !== undefined) updateData.keyType = body.keyType;
    if (body.isTrial !== undefined) updateData.isTrial = body.isTrial;
    if (body.expiresAt !== undefined) updateData.expiresAt = body.expiresAt;
    if (body.activatedAt !== undefined) updateData.activatedAt = body.activatedAt;
    if (body.activeFlows !== undefined) updateData.activeFlows = body.activeFlows;
    
    // User info fields
    if (body.fullName !== undefined) updateData.fullName = body.fullName;
    if (body.companyName !== undefined) updateData.companyName = body.companyName;
    if (body.numberOfEmployees !== undefined) updateData.numberOfEmployees = body.numberOfEmployees;
    if (body.goal !== undefined) updateData.goal = body.goal;
    if (body.notes !== undefined) updateData.notes = body.notes;
    
    // Feature flags
    if (body.ssoEnabled !== undefined) updateData.ssoEnabled = body.ssoEnabled;
    if (body.gitSyncEnabled !== undefined) updateData.gitSyncEnabled = body.gitSyncEnabled;
    if (body.showPoweredBy !== undefined) updateData.showPoweredBy = body.showPoweredBy;
    if (body.embeddingEnabled !== undefined) updateData.embeddingEnabled = body.embeddingEnabled;
    if (body.auditLogEnabled !== undefined) updateData.auditLogEnabled = body.auditLogEnabled;
    if (body.customAppearanceEnabled !== undefined) updateData.customAppearanceEnabled = body.customAppearanceEnabled;
    if (body.manageProjectsEnabled !== undefined) updateData.manageProjectsEnabled = body.manageProjectsEnabled;
    if (body.managePiecesEnabled !== undefined) updateData.managePiecesEnabled = body.managePiecesEnabled;
    if (body.manageTemplatesEnabled !== undefined) updateData.manageTemplatesEnabled = body.manageTemplatesEnabled;
    if (body.apiKeysEnabled !== undefined) updateData.apiKeysEnabled = body.apiKeysEnabled;
    if (body.customDomainsEnabled !== undefined) updateData.customDomainsEnabled = body.customDomainsEnabled;
    if (body.projectRolesEnabled !== undefined) updateData.projectRolesEnabled = body.projectRolesEnabled;
    if (body.alertsEnabled !== undefined) updateData.alertsEnabled = body.alertsEnabled;
    if (body.analyticsEnabled !== undefined) updateData.analyticsEnabled = body.analyticsEnabled;
    if (body.globalConnectionsEnabled !== undefined) updateData.globalConnectionsEnabled = body.globalConnectionsEnabled;
    if (body.customRolesEnabled !== undefined) updateData.customRolesEnabled = body.customRolesEnabled;
    if (body.environmentsEnabled !== undefined) updateData.environmentsEnabled = body.environmentsEnabled;
    if (body.tablesEnabled !== undefined) updateData.tablesEnabled = body.tablesEnabled;
    

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Update the key
    const { data, error } = await supabaseAdmin
      .from(LICENSE_KEYS_TABLE)
      .update(updateData)
      .eq('key', keyValue)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log the action
    await supabaseAdmin.from(KEY_HISTORY_TABLE).insert({
      key_value: keyValue,
      action: 'updated',
      details: { updated_fields: Object.keys(updateData) },
    });

    return NextResponse.json(
      { success: true, data },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error: any) {
    console.error('Error updating license key:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update license key' },
      { status: 500 }
    );
  }
}
