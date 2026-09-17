const fs = require('fs');
let content = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

const validationCode = `
  // Validate session on load
  useEffect(() => {
    const validateSession = async () => {
      if (currentUser && isDatabaseConnected) {
        // verify user still exists and is active
        try {
          const { data, error } = await supabase
            .from(currentUser.role + 's')
            .select('status')
            .eq('id', currentUser.id)
            .single();
            
          if (error || !data || data.status !== 'active') {
            console.warn("Invalid session, logging out");
            logout();
          }
        } catch (err) {
          console.error("Session validation error:", err);
        }
      }
    };
    
    validateSession();
  }, []);
`;

// Insert after refreshData useCallback
content = content.replace(
  "  useEffect(() => {\n    refreshData();\n  }, [refreshData]);",
  "  useEffect(() => {\n    refreshData();\n  }, [refreshData]);\n\n" + validationCode
);

fs.writeFileSync('src/context/AppContext.tsx', content);
