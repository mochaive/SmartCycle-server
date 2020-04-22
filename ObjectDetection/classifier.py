# Import libraries
import numpy as np
import os
import six.moves.urllib as urllib
import sys
import tarfile
import tensorflow as tf
import zipfile
import cv2
import time

from collections import defaultdict
from io import StringIO
from matplotlib import pyplot as plt
from PIL import Image
import modules.label_map_util
from keras.preprocessing.image import load_img
from keras.preprocessing.image import img_to_array
from models.research.object_detection.utils import label_map_util
from models.research.object_detection.utils import visualization_utils as vis_util

def setting():
    # What model
    directPath = os.path.dirname(os.path.realpath(__file__))
    MODEL_NAME = os.path.join(directPath, 'trained-inference-graphs/output_inference_graph_v1.pb')

    # Path to frozen detection graph. This is the actual model that is used for the object detection.
    PATH_TO_CKPT = MODEL_NAME + '/frozen_inference_graph.pb'

    # List of the strings that is used to add correct label for each box.
    PATH_TO_LABELS = os.path.join(directPath, 'training/label_map.pbtxt')

    # Number of classes to detect
    NUM_CLASSES = 10


    # Load a (frozen) Tensorflow model into memory.
    detection_graph = tf.Graph()
    with detection_graph.as_default():
        od_graph_def = tf.GraphDef()
        with tf.gfile.GFile(PATH_TO_CKPT, 'rb') as fid:
            serialized_graph = fid.read()
            od_graph_def.ParseFromString(serialized_graph)
            tf.import_graph_def(od_graph_def, name='')


    # Loading label map
    label_map = label_map_util.load_labelmap(PATH_TO_LABELS)
    categories = label_map_util.convert_label_map_to_categories(
        label_map, max_num_classes=NUM_CLASSES, use_display_name=True)
    category_index = label_map_util.create_category_index(categories)

    return detection_graph, category_index


# Helper code
def load_image_into_numpy_array(image):
    (im_width, im_height) = image.size
    return np.array(image.getdata()).reshape(
        (im_height, im_width, 3)).astype(np.uint8)


if __name__ == '__main__':
    detection_graph, category_index = setting()

    where_to_check = "/home/smartcycle/smartcycle_server/pictures/ai/"

    where_to_save = "/home/smartcycle/smartcycle_server/"

    while True: # infinite loop
        i = 0
        while True:
            #if there is an image,
            if os.listdir(where_to_check) != []:
                print("\n----------\nfound\n----------\n")
                recognize_start = time.time()
                break
            #else, wait.
            else:
                print("not found\n")
                time.sleep(0.2)
                
        # Detection
        with detection_graph.as_default():
            with tf.Session(graph=detection_graph) as sess:
                # load image
                try:
                    image = where_to_check + os.listdir(where_to_check)[0]
                except IndexError:
                    continue
                
                image_np = load_img(image)

                # convert to numpy array
                image_np = img_to_array(image_np)

                # delete image
                os.remove(where_to_check + os.listdir(where_to_check)[0])

                # Expand dimensions since the model expects images to have shape: [1, None, None, 3]
                image_np_expanded = np.expand_dims(image_np, axis=0)
                # Extract image tensor
                image_tensor = detection_graph.get_tensor_by_name('image_tensor:0')
                # Extract detection boxes
                boxes = detection_graph.get_tensor_by_name('detection_boxes:0')
                # Extract detection scores
                scores = detection_graph.get_tensor_by_name('detection_scores:0')
                # Extract detection classes
                classes = detection_graph.get_tensor_by_name('detection_classes:0')
                # Extract number of detectionsd
                num_detections = detection_graph.get_tensor_by_name('num_detections:0')

                # Actual detection.
                (boxes, scores, classes, num_detections) = sess.run(
                    [boxes, scores, classes, num_detections],
                    feed_dict={image_tensor: image_np_expanded})

                image, class_list, accuracy_list = vis_util.visualize_boxes_and_labels_on_image_array(
                image_np,
                np.squeeze(boxes),
                np.squeeze(classes).astype(np.int32),
                np.squeeze(scores),
                category_index,
                use_normalized_coordinates=True,
                line_thickness=8)

                trash_list = ['pet', 'carton', 'heat_resistant_glass', "umbrella", "battery", "styrofoam", "tissue", "butan", "glass_bottle", "drug"]

                best_idx = 0
                best_acc = 0
                index = 0

                for acc in accuracy_list:
                    if best_acc < acc:
                        best_idx = index
                        best_acc = acc
                    index += 1
                    
                if best_acc < 0.80: # least acceptable score.
                    what_to_write = 99
                else:
                    what_to_write = trash_list.index(class_list[best_idx])

                elapsed_time = time.time() - recognize_start
                print("\n\nelapsed time per 1 recognizing : %.2f(s)\n" % elapsed_time)

                np.savetxt(where_to_save+"predicted.txt", [what_to_write])
                sess.run(tf.global_variables_initializer())