from neo4j import GraphDatabase
from functools import lru_cache
from typing import List, Dict, Any, Optional


class Neo4jClient:
    """Client for interacting with Neo4j database."""
    
    def __init__(self):
        """Initialize Neo4j client with configuration."""
        self._URI = settings.NEO4J_URI
        self._USER = settings.NEO4J_USER
        self._PASSWORD = settings.NEO4J_PASSWORD
        self.logger = logging.getLogger(self.__class__.__name__)
        self._driver = None
    
    def connect(self):
        """Establish connection to Neo4j database."""
        try:
            self._driver = GraphDatabase.driver(
                self._URI,
                auth=(self._USER, self._PASSWORD)
            )
            self.logger.info("Successfully connected to Neo4j database")
        except Exception as e:
            self.log_error(e, {"uri": self._URI})
            raise
    
    def close(self):
        """Close the Neo4j connection."""
        if self._driver:
            self._driver.close()
            self.logger.info("Neo4j connection closed")
    
    def __enter__(self):
        """Context manager entry."""
        self.connect()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.close()
    
    @lru_cache(maxsize=settings.CACHE_SIZE)
    def execute_query(self, query: str, params: Optional[Dict] = None) -> List[Dict[str, Any]]:
        """
        Execute a Cypher query with caching.
        
        Args:
            query: Cypher query string
            params: Query parameters
            
        Returns:
            List of result records
        """
        if not self._driver:
            self.connect()
            
        try:
            with self._driver.session() as session:
                result = session.run(query, params or {})
                return [dict(record) for record in result]
        except Exception as e:
            self.log_error(e, {"query": query, "params": params})
            raise
    
    def log_error(self, error: Exception, context: Optional[Dict] = None):
        """Log an error with context."""
        error_msg = f"Neo4j error: {str(error)}"
        if context:
            error_msg += f" Context: {context}"
        self.logger.error(error_msg) 