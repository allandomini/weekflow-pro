// Debug script to check Supabase connection and create canvas_items table
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugSupabase() {
  console.log('🔍 Debugging Supabase connection...');
  console.log('URL:', supabaseUrl);
  console.log('Key:', supabaseAnonKey ? 'Present' : 'Missing');

  try {
    // Test connection
    const { data: testData, error: testError } = await supabase
      .from('projects')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Supabase connection failed:', testError);
      return;
    }
    
    console.log('✅ Supabase connection successful');

    // Check if canvas_items table exists
    const { data: tableData, error: tableError } = await supabase
      .from('canvas_items')
      .select('count')
      .limit(1);

    if (tableError) {
      if (tableError.code === 'PGRST116' || tableError.message.includes('does not exist')) {
        console.log('❌ canvas_items table does not exist');
        console.log('📝 Creating canvas_items table...');
        
        // Create the table using SQL
        const { data: createData, error: createError } = await supabase.rpc('exec_sql', {
          sql: `
            -- Create canvas_items table for project canvas functionality
            CREATE TABLE IF NOT EXISTS canvas_items (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
              user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
              type TEXT NOT NULL CHECK (type IN ('todo', 'note', 'finance', 'image', 'document')),
              position_x REAL NOT NULL DEFAULT 0,
              position_y REAL NOT NULL DEFAULT 0,
              data JSONB NOT NULL DEFAULT '{}',
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            -- Create indexes for better performance
            CREATE INDEX IF NOT EXISTS idx_canvas_items_project_id ON canvas_items(project_id);
            CREATE INDEX IF NOT EXISTS idx_canvas_items_user_id ON canvas_items(user_id);
            CREATE INDEX IF NOT EXISTS idx_canvas_items_type ON canvas_items(type);

            -- Enable RLS (Row Level Security)
            ALTER TABLE canvas_items ENABLE ROW LEVEL SECURITY;

            -- Create RLS policies
            CREATE POLICY "Users can view their own canvas items" ON canvas_items
              FOR SELECT USING (auth.uid() = user_id);

            CREATE POLICY "Users can insert their own canvas items" ON canvas_items
              FOR INSERT WITH CHECK (auth.uid() = user_id);

            CREATE POLICY "Users can update their own canvas items" ON canvas_items
              FOR UPDATE USING (auth.uid() = user_id);

            CREATE POLICY "Users can delete their own canvas items" ON canvas_items
              FOR DELETE USING (auth.uid() = user_id);

            -- Create function to automatically update updated_at timestamp
            CREATE OR REPLACE FUNCTION update_canvas_items_updated_at()
            RETURNS TRIGGER AS $$
            BEGIN
              NEW.updated_at = NOW();
              RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;

            -- Create trigger for updated_at
            CREATE TRIGGER update_canvas_items_updated_at
              BEFORE UPDATE ON canvas_items
              FOR EACH ROW
              EXECUTE FUNCTION update_canvas_items_updated_at();
          `
        });

        if (createError) {
          console.error('❌ Failed to create canvas_items table:', createError);
        } else {
          console.log('✅ canvas_items table created successfully');
        }
      } else {
        console.error('❌ Error checking canvas_items table:', tableError);
      }
    } else {
      console.log('✅ canvas_items table exists');
    }

    // Test inserting a sample item
    const testItem = {
      id: 'test-' + Date.now(),
      project_id: 'test-project-id',
      user_id: 'test-user-id',
      type: 'note',
      position_x: 100,
      position_y: 100,
      data: { title: 'Test Note', content: 'This is a test' }
    };

    console.log('🧪 Testing insert operation...');
    const { data: insertData, error: insertError } = await supabase
      .from('canvas_items')
      .insert(testItem)
      .select();

    if (insertError) {
      console.error('❌ Test insert failed:', insertError);
    } else {
      console.log('✅ Test insert successful:', insertData);
      
      // Clean up test data
      await supabase
        .from('canvas_items')
        .delete()
        .eq('id', testItem.id);
      console.log('🧹 Test data cleaned up');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugSupabase();
