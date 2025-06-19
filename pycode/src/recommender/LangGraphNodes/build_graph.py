from src.Utils.utils import *
from src.Recommender.agents.ingest_agent import ingest_agent
from src.Recommender.agents.rag_agent import rag_agent

import json

class Graph:
    def __init__(self):
        logger.info("Initializing Graph object.")
        self.nodes = {}
        self.edges = {}

    def add_node(self, name: str, func: callable):
        """
        Adds a node to the graph.

        Args:
            name (str): The name of the node.
            func (callable): The function associated with the node.

        Returns:
            None
        """
        logger.info(f"Adding node '{name}' to the graph.")
        self.nodes[name] = func

    def add_edge(self, from_node: str, to_node: str):
        """
        Adds a directed edge between two nodes in the graph.

        Args:
            from_node (str): The name of the starting node.
            to_node (str): The name of the ending node.

        Returns:
            None
        """
        logger.info(f"Adding edge from '{from_node}' to '{to_node}'.")
        self.edges[from_node] = to_node

    def invoke(self, input: dict) -> dict:
        """
        Executes the graph starting from the 'ingest_agent' node.

        Args:
            input (dict): The input data for the graph execution.

        Returns:
            dict: The final result after executing all nodes in the graph.
        """
        logger.info(format_step(1, f"Invoking the graph with input: {input}"))
        current_node = "ingest_agent"
        result = self.nodes[current_node](input)
        logger.info(format_step(2, f"Node '{current_node}' executed. \nResult: {result}"))

        step_counter = 3
        while current_node in self.edges:
            current_node = self.edges[current_node]
            logger.info(format_step(step_counter, f"Moving to next node: '{current_node}'."))
            
            # Ensure the output of each node becomes the input for the next node
            result = self.nodes[current_node](result)

            # Handle specific cases for passing keys
            if current_node == "ingest_agent":
                #logger.info(f"Output of ingest_agent: {result}")
                result = {"case_data": result.get("case_data", None)}

            if current_node == "rag_agent":
                #logger.info(f"Output of rag_agent:\n {result}")
                result = {"retrieved_data": result.get("retrieved_data", None)}

            # Pretty print the output of each step
            #logger.info(format_step(step_counter + 1, f"Node '{current_node}' executed. Result: {json.dumps(result, indent=4)}"))
            logger.info(format_step(step_counter + 1, f"Node '{current_node}' executed."))

            if result is None:
                logger.error(f"Node '{current_node}' returned None. Skipping to the next step.")
                continue

            step_counter += 2

        logger.info(format_step(step_counter, "Graph execution completed."))
        return result

    def show_graph(self):
        """
        Logs the structure of the graph, including nodes and edges.

        Returns:
            None
        """
        logger.info("Graph Structure:")
        logger.info("Nodes:")
        for node in self.nodes:
            logger.info(f"  - {node}")
        logger.info("Edges:")
        for from_node, to_node in self.edges.items():
            logger.info(f"  - {from_node} -> {to_node}")

    def show_graph_as_picture(self, output_path="/Users/aman/Welzin/Dev/credzin/Output/logs_20_05_2025/graph.png"):
        """
        Generates a visual representation of the graph and saves it as a picture.

        Args:
            output_path (str): The file path where the graph image will be saved.

        Returns:
            None
        """
        import networkx as nx
        import matplotlib.pyplot as plt

        # Create a directed graph using NetworkX
        G = nx.DiGraph()
        for from_node, to_node in self.edges.items():
            G.add_edge(from_node, to_node)

        # Draw the graph
        plt.figure(figsize=(10, 6))
        pos = nx.spring_layout(G)
        nx.draw(G, pos, with_labels=True, node_color='lightblue', edge_color='gray', node_size=3000, font_size=10, font_weight='bold')

        # Save the graph as an image
        plt.savefig(output_path)
        plt.close()
        logger.info(f"Graph saved as a picture at {output_path}.")

def card_graph():
    """
    Builds and returns the legal graph workflow.
    """
    logger.info("Creating the legal graph workflow.")
    graph = Graph()

    # Add nodes to the graph
    graph.add_node("ingest_agent", ingest_agent)
    graph.add_node("rag_agent", rag_agent)
    #graph.add_node("write_output", write_output)

    # Define the workflow by connecting nodes in the desired order
    graph.add_edge("ingest_agent", "rag_agent")
    #graph.add_edge("precedence_agent", "write_output")

    logger.info("Credit graph workflow created successfully.")
    return graph