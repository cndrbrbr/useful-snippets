function OnElement_PoolsLanes(theElement) {
    var result = "";
    if (theElement.Type == "Pool" || theElement.Stereotype == "Pool") {
        // Pool muss typisiert sein (Classifier gesetzt, ggf. OperationalRole/Architecture)
        if (theElement.ClassifierID == 0) {
            result += "L4-C Verstoß: Pool '" + theElement.Name +
                "' ist nicht typisiert (kein Classifier zugewiesen).\n";
        }
    }
    if (theElement.Type == "Lane" || theElement.Stereotype == "Lane") {
        if (theElement.ClassifierID == 0) {
            result += "L4-C Verstoß: Lane '" + theElement.Name +
                "' ist nicht typisiert.\n";
        }
    }
    return result;
}