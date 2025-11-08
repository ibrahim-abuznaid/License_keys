import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateLicenseKey } from '@/lib/key-generator';
import { sendDealClosedEmail, sendCustomEmail } from '@/lib/email-service';
import { KEY_HISTORY_TABLE, LICENSE_KEYS_TABLE } from '@/lib/config';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { activeFlows, sendEmail = true, subject, htmlBody } = body;
    const trialKeyValue = params.id;

    // Get current trial key
    const { data: trialKey, error: fetchError } = await supabaseAdmin
      .from(LICENSE_KEYS_TABLE)
      .select('*')
      .eq('key', trialKeyValue)
      .single();

    if (fetchError || !trialKey) {
      return NextResponse.json(
        { error: 'License key not found' },
        { status: 404 }
      );
    }

    // Convert trial key to development key (subscribed, no expiry)
    const { data: developmentKey, error: devUpdateError } = await supabaseAdmin
      .from(LICENSE_KEYS_TABLE)
      .update({
        expiresAt: null, // null means no expiry = subscribed
        activatedAt: new Date().toISOString(), // Set activation time when converting to subscribed
        isTrial: false,
        keyType: 'development',
        activeFlows: activeFlows || trialKey.activeFlows,
      })
      .eq('key', trialKeyValue)
      .select()
      .single();

    if (devUpdateError) {
      throw devUpdateError;
    }

    // Generate new production key
    const productionKeyValue = generateLicenseKey();

    const { data: productionKey, error: prodInsertError } = await supabaseAdmin
      .from(LICENSE_KEYS_TABLE)
      .insert({
        key: productionKeyValue,
        email: trialKey.email,
        expiresAt: null, // null means no expiry = subscribed
        activatedAt: new Date().toISOString(), // Set activation time when key is created
        isTrial: false,
        keyType: 'production',
        activeFlows: activeFlows || trialKey.activeFlows,
        // Copy all user info and feature flags from trial key
        fullName: trialKey.fullName,
        companyName: trialKey.companyName,
        numberOfEmployees: trialKey.numberOfEmployees,
        goal: trialKey.goal,
        notes: trialKey.notes,
        ssoEnabled: trialKey.ssoEnabled,
        gitSyncEnabled: trialKey.gitSyncEnabled,
        showPoweredBy: trialKey.showPoweredBy,
        embeddingEnabled: trialKey.embeddingEnabled,
        auditLogEnabled: trialKey.auditLogEnabled,
        customAppearanceEnabled: trialKey.customAppearanceEnabled,
        manageProjectsEnabled: trialKey.manageProjectsEnabled,
        managePiecesEnabled: trialKey.managePiecesEnabled,
        manageTemplatesEnabled: trialKey.manageTemplatesEnabled,
        apiKeysEnabled: trialKey.apiKeysEnabled,
        customDomainsEnabled: trialKey.customDomainsEnabled,
        projectRolesEnabled: trialKey.projectRolesEnabled,
        flowIssuesEnabled: trialKey.flowIssuesEnabled,
        alertsEnabled: trialKey.alertsEnabled,
        analyticsEnabled: trialKey.analyticsEnabled,
        globalConnectionsEnabled: trialKey.globalConnectionsEnabled,
        customRolesEnabled: trialKey.customRolesEnabled,
        environmentsEnabled: trialKey.environmentsEnabled,
        agentsEnabled: trialKey.agentsEnabled,
        tablesEnabled: trialKey.tablesEnabled,
        todosEnabled: trialKey.todosEnabled,
        mcpsEnabled: trialKey.mcpsEnabled,
        premiumPieces: trialKey.premiumPieces,
      })
      .select()
      .single();

    if (prodInsertError) {
      throw prodInsertError;
    }

    // Log actions to history
    await supabaseAdmin.from(KEY_HISTORY_TABLE).insert([
      {
        key_value: trialKeyValue,
        action: 'deal_closed',
        details: { 
          converted_to: 'development',
          activeFlows,
          previous_expiry: trialKey.expiresAt,
          production_key: productionKeyValue,
        },
      },
      {
        key_value: productionKeyValue,
        action: 'created',
        details: { 
          type: 'production',
          source: 'deal_closed',
          activeFlows,
          related_dev_key: trialKeyValue,
        },
      },
    ]);

    // Send welcome email with both keys (only if sendEmail is true)
    if (sendEmail) {
      try {
        if (subject && htmlBody) {
          // Send custom email
          await sendCustomEmail({
            to: trialKey.email,
            subject,
            htmlBody,
          });
        } else {
          // Send default deal-closed email
          await sendDealClosedEmail({
            to: trialKey.email,
            developmentKey,
            productionKey,
            activeFlowsLimit: activeFlows || trialKey.activeFlows || 0,
          });
        }
      } catch (emailError) {
        console.error('Failed to send deal closed email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({ 
      data: {
        developmentKey,
        productionKey,
      }
    });
  } catch (error: any) {
    console.error('Error closing deal:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to close deal' },
      { status: 500 }
    );
  }
}
